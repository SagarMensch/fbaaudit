"""
Deep-Hybrid Fraud Detector
Combines Autoencoder (Neural Network) + Isolation Forest for multi-dimensional fraud detection
Based on: "Anomaly Detection using combination of Autoencoder and Isolation Forest"
"""
import numpy as np
import logging
import pickle
import os
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime

# ML imports
try:
    from tensorflow.keras.models import Model, load_model
    from tensorflow.keras.layers import Input, Dense
    from tensorflow.keras.callbacks import EarlyStopping
    KERAS_AVAILABLE = True
except ImportError:
    KERAS_AVAILABLE = False
    
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import MinMaxScaler
import joblib

logger = logging.getLogger(__name__)

# Model save paths
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'saved_models')
os.makedirs(MODEL_DIR, exist_ok=True)

ENCODER_PATH = os.path.join(MODEL_DIR, 'fraud_encoder.h5')
AUTOENCODER_PATH = os.path.join(MODEL_DIR, 'fraud_autoencoder.h5')
FOREST_PATH = os.path.join(MODEL_DIR, 'fraud_forest.joblib')
SCALER_PATH = os.path.join(MODEL_DIR, 'fraud_scaler.joblib')


@dataclass
class FraudCheckResult:
    """Result from fraud detection"""
    invoice_id: str
    reconstruction_error: float
    isolation_score: float
    combined_score: float  # 0-100, higher = more fraudulent
    verdict: str  # APPROVED, SUSPICIOUS, FRAUD
    explanation: str
    feature_contributions: Dict[str, float]


class HybridFraudDetector:
    """
    Hybrid Fraud Detection Model
    
    Architecture (from paper):
    1. Autoencoder: Input(N) → Dense(16) → Latent(4) → Dense(16) → Output(N)
    2. Isolation Forest: Trained on latent space representations
    
    Why this works:
    - Autoencoder learns the "DNA" of normal invoices
    - High reconstruction error = invoice doesn't fit normal pattern
    - Isolation Forest on latent space = more robust anomaly detection
    """
    
    # Feature names for invoice data
    FEATURE_NAMES = [
        'amount', 'weight', 'distance', 'fuel_rate', 'vehicle_capacity',
        'day_of_week', 'vendor_trust_score', 'rate_per_km', 'is_weekend',
        'is_express', 'month', 'hour_submitted'
    ]
    
    def __init__(
        self,
        encoding_dim: int = 4,
        contamination: float = 0.02,  # Expected fraud rate
        reconstruction_threshold: float = 0.1,
        isolation_threshold: float = -0.3
    ):
        self.encoding_dim = encoding_dim
        self.contamination = contamination
        self.reconstruction_threshold = reconstruction_threshold
        self.isolation_threshold = isolation_threshold
        
        self.autoencoder = None
        self.encoder = None
        self.iso_forest = None
        self.scaler = MinMaxScaler()
        
        self.is_trained = False
        self.input_dim = len(self.FEATURE_NAMES)
        
        # Try to load existing models
        self._load_models()
    
    def _build_autoencoder(self) -> Tuple[Model, Model]:
        """Build the Autoencoder architecture"""
        if not KERAS_AVAILABLE:
            raise ImportError("TensorFlow/Keras required for Autoencoder")
        
        # Input layer
        input_layer = Input(shape=(self.input_dim,))
        
        # Encoder
        encoded = Dense(16, activation='relu', name='encoder_1')(input_layer)
        encoded = Dense(8, activation='relu', name='encoder_2')(encoded)
        latent = Dense(self.encoding_dim, activation='relu', name='latent')(encoded)
        
        # Decoder
        decoded = Dense(8, activation='relu', name='decoder_1')(latent)
        decoded = Dense(16, activation='relu', name='decoder_2')(decoded)
        output = Dense(self.input_dim, activation='sigmoid', name='output')(decoded)
        
        # Full autoencoder
        autoencoder = Model(inputs=input_layer, outputs=output, name='autoencoder')
        
        # Encoder only (for extracting latent features)
        encoder = Model(inputs=input_layer, outputs=latent, name='encoder')
        
        autoencoder.compile(optimizer='adam', loss='mse')
        
        return autoencoder, encoder
    
    def train(self, invoice_data: np.ndarray, epochs: int = 50, batch_size: int = 32) -> Dict:
        """
        Train the hybrid model on historical invoice data.
        
        Args:
            invoice_data: numpy array of shape (n_samples, n_features)
            epochs: Training epochs for autoencoder
            batch_size: Batch size for training
            
        Returns:
            Training metrics
        """
        logger.info(f"Training hybrid fraud detector on {len(invoice_data)} samples")
        
        # Normalize data
        normalized_data = self.scaler.fit_transform(invoice_data)
        
        # Build autoencoder
        self.autoencoder, self.encoder = self._build_autoencoder()
        
        # Train autoencoder
        early_stop = EarlyStopping(monitor='loss', patience=5, restore_best_weights=True)
        
        history = self.autoencoder.fit(
            normalized_data, normalized_data,
            epochs=epochs,
            batch_size=batch_size,
            validation_split=0.1,
            callbacks=[early_stop],
            verbose=0
        )
        
        # Extract latent representations
        latent_data = self.encoder.predict(normalized_data)
        
        # Train Isolation Forest on latent space
        self.iso_forest = IsolationForest(
            contamination=self.contamination,
            random_state=42,
            n_estimators=100
        )
        self.iso_forest.fit(latent_data)
        
        # Calculate baseline reconstruction errors
        reconstructed = self.autoencoder.predict(normalized_data)
        recon_errors = np.mean(np.abs(normalized_data - reconstructed), axis=1)
        
        self.reconstruction_threshold = np.percentile(recon_errors, 95)
        
        # Save models
        self._save_models()
        
        self.is_trained = True
        
        return {
            "samples_trained": len(invoice_data),
            "final_loss": float(history.history['loss'][-1]),
            "reconstruction_threshold": float(self.reconstruction_threshold),
            "epochs_run": len(history.history['loss'])
        }
    
    def check_invoice(self, invoice_features: Dict) -> FraudCheckResult:
        """
        Check a single invoice for fraud.
        
        Args:
            invoice_features: Dict with feature names as keys
            
        Returns:
            FraudCheckResult with scores and verdict
        """
        if not self.is_trained:
            # Return default result if model not trained
            return FraudCheckResult(
                invoice_id=invoice_features.get('invoice_id', 'UNKNOWN'),
                reconstruction_error=0.0,
                isolation_score=0.0,
                combined_score=0.0,
                verdict="APPROVED",
                explanation="Model not trained - default approval",
                feature_contributions={}
            )
        
        # Extract features in correct order
        feature_vector = self._extract_features(invoice_features)
        
        # Normalize
        normalized = self.scaler.transform(feature_vector.reshape(1, -1))
        
        # Get reconstruction error
        reconstructed = self.autoencoder.predict(normalized, verbose=0)
        recon_error = float(np.mean(np.abs(normalized - reconstructed)))
        
        # Get latent representation and isolation score
        latent = self.encoder.predict(normalized, verbose=0)
        iso_score = float(self.iso_forest.score_samples(latent)[0])
        
        # Calculate combined score (0-100, higher = more fraudulent)
        # Normalize reconstruction error (0-1)
        recon_normalized = min(recon_error / self.reconstruction_threshold, 2.0) / 2.0
        
        # Normalize isolation score (-1 to 0 for normal, can go positive for anomalies)
        iso_normalized = max(0, -iso_score)  # Convert to 0-1 range
        
        # Combined score (weighted average)
        combined = (recon_normalized * 0.4 + iso_normalized * 0.6) * 100
        combined = min(100, max(0, combined))
        
        # Determine verdict
        if combined >= 70:
            verdict = "FRAUD"
            explanation = f"High anomaly score ({combined:.1f}/100). Pattern doesn't match normal invoices."
        elif combined >= 40:
            verdict = "SUSPICIOUS"
            explanation = f"Moderate anomaly score ({combined:.1f}/100). Manual review recommended."
        else:
            verdict = "APPROVED"
            explanation = f"Low anomaly score ({combined:.1f}/100). Invoice pattern is normal."
        
        # Calculate feature contributions
        feature_contributions = self._calculate_contributions(normalized[0], reconstructed[0])
        
        return FraudCheckResult(
            invoice_id=invoice_features.get('invoice_id', 'UNKNOWN'),
            reconstruction_error=recon_error,
            isolation_score=iso_score,
            combined_score=combined,
            verdict=verdict,
            explanation=explanation,
            feature_contributions=feature_contributions
        )
    
    def _extract_features(self, invoice: Dict) -> np.ndarray:
        """Extract feature vector from invoice dict"""
        features = []
        
        for name in self.FEATURE_NAMES:
            value = invoice.get(name, 0)
            if isinstance(value, (int, float)):
                features.append(float(value))
            else:
                features.append(0.0)
        
        return np.array(features)
    
    def _calculate_contributions(self, original: np.ndarray, reconstructed: np.ndarray) -> Dict[str, float]:
        """Calculate which features contributed most to anomaly"""
        errors = np.abs(original - reconstructed)
        total_error = np.sum(errors) + 1e-8
        
        contributions = {}
        for i, name in enumerate(self.FEATURE_NAMES):
            contributions[name] = float(errors[i] / total_error * 100)
        
        return contributions
    
    def _save_models(self):
        """Save trained models to disk"""
        try:
            self.autoencoder.save(AUTOENCODER_PATH)
            self.encoder.save(ENCODER_PATH)
            joblib.dump(self.iso_forest, FOREST_PATH)
            joblib.dump(self.scaler, SCALER_PATH)
            logger.info("Models saved successfully")
        except Exception as e:
            logger.error(f"Failed to save models: {e}")
    
    def _load_models(self):
        """Load models from disk if available"""
        try:
            if all(os.path.exists(p) for p in [AUTOENCODER_PATH, ENCODER_PATH, FOREST_PATH, SCALER_PATH]):
                if KERAS_AVAILABLE:
                    self.autoencoder = load_model(AUTOENCODER_PATH)
                    self.encoder = load_model(ENCODER_PATH)
                    self.iso_forest = joblib.load(FOREST_PATH)
                    self.scaler = joblib.load(SCALER_PATH)
                    self.is_trained = True
                    logger.info("Loaded pre-trained fraud detection models")
        except Exception as e:
            logger.warning(f"Could not load models: {e}")
            self.is_trained = False


# Singleton instance
fraud_detector = HybridFraudDetector()


def generate_sample_invoices(n_samples: int = 1000, fraud_rate: float = 0.02) -> np.ndarray:
    """Generate sample invoice data for training"""
    np.random.seed(42)
    
    # Normal invoices
    n_normal = int(n_samples * (1 - fraud_rate))
    normal = np.random.rand(n_normal, len(HybridFraudDetector.FEATURE_NAMES))
    
    # Set realistic ranges for normal invoices
    normal[:, 0] *= 50000  # amount: 0-50k
    normal[:, 1] = normal[:, 1] * 20 + 1  # weight: 1-21 tons
    normal[:, 2] = normal[:, 2] * 2000 + 100  # distance: 100-2100 km
    normal[:, 3] = normal[:, 3] * 20 + 80  # fuel_rate: 80-100
    normal[:, 4] = np.random.choice([9, 12, 16, 22, 32], n_normal)  # vehicle capacity
    normal[:, 5] = np.random.randint(0, 7, n_normal)  # day_of_week
    normal[:, 6] = normal[:, 6] * 0.3 + 0.7  # vendor_trust: 0.7-1.0
    normal[:, 7] = normal[:, 0] / (normal[:, 2] + 1)  # rate_per_km (derived)
    normal[:, 8] = (normal[:, 5] >= 5).astype(float)  # is_weekend
    normal[:, 9] = np.random.choice([0, 1], n_normal, p=[0.8, 0.2])  # is_express
    normal[:, 10] = np.random.randint(1, 13, n_normal)  # month
    normal[:, 11] = np.random.randint(8, 18, n_normal)  # hour_submitted
    
    # Fraudulent invoices (anomalous patterns)
    n_fraud = n_samples - n_normal
    fraud = np.random.rand(n_fraud, len(HybridFraudDetector.FEATURE_NAMES))
    
    # Fraud patterns: High amount + Low weight + Weekend + Low trust vendor
    fraud[:, 0] = fraud[:, 0] * 30000 + 40000  # amount: 40-70k (high)
    fraud[:, 1] = fraud[:, 1] * 2 + 0.5  # weight: 0.5-2.5 tons (low)
    fraud[:, 2] = fraud[:, 2] * 300 + 50  # distance: 50-350 km (short)
    fraud[:, 3] = fraud[:, 3] * 10 + 95  # fuel_rate: inflated
    fraud[:, 4] = np.random.choice([32], n_fraud)  # always big truck
    fraud[:, 5] = np.random.choice([5, 6], n_fraud)  # always weekend
    fraud[:, 6] = fraud[:, 6] * 0.2 + 0.4  # vendor_trust: 0.4-0.6 (low)
    fraud[:, 7] = fraud[:, 0] / (fraud[:, 2] + 1)  # rate_per_km (very high)
    fraud[:, 8] = 1.0  # is_weekend
    fraud[:, 9] = 0  # not express
    fraud[:, 10] = np.random.randint(1, 13, n_fraud)
    fraud[:, 11] = np.random.choice([23, 0, 1, 2], n_fraud)  # late night submissions
    
    # Combine
    all_data = np.vstack([normal, fraud])
    np.random.shuffle(all_data)
    
    return all_data
