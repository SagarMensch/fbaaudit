"""
Emissions Calculator (ESG/Sustainability)
==========================================
Carbon footprint calculation for freight shipments.
GLEC Framework v3.0 compliant for Scope 3 reporting.

Author: SequelString AI Team
"""

import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from decimal import Decimal
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


# ============================================================================
# GLEC FRAMEWORK v3.0 EMISSION FACTORS
# ============================================================================
# CO2e per tonne-km (grams) - Global Logistics Emissions Council

EMISSION_FACTORS = {
    # Road Transport
    'ROAD': {
        'LCV': {'co2e_per_tkm': 150.0, 'description': 'Light Commercial Vehicle (<3.5t)'},
        'MCV': {'co2e_per_tkm': 90.0, 'description': 'Medium Commercial Vehicle (3.5-12t)'},
        'HCV': {'co2e_per_tkm': 62.0, 'description': 'Heavy Commercial Vehicle (>12t, rigid)'},
        'ARTICULATED': {'co2e_per_tkm': 51.0, 'description': 'Articulated truck/trailer'},
        'CONTAINER_20FT': {'co2e_per_tkm': 55.0, 'description': '20ft container truck'},
        'CONTAINER_40FT': {'co2e_per_tkm': 48.0, 'description': '40ft container truck'},
        'DEFAULT': {'co2e_per_tkm': 62.0, 'description': 'Default road freight'}
    },
    
    # Rail Transport
    'RAIL': {
        'ELECTRIC': {'co2e_per_tkm': 18.0, 'description': 'Electric freight rail'},
        'DIESEL': {'co2e_per_tkm': 28.0, 'description': 'Diesel freight rail'},
        'MIXED': {'co2e_per_tkm': 22.0, 'description': 'Mixed traction rail'},
        'DEFAULT': {'co2e_per_tkm': 22.0, 'description': 'Default rail freight'}
    },
    
    # Air Transport
    'AIR': {
        'DOMESTIC': {'co2e_per_tkm': 1100.0, 'description': 'Domestic air cargo (<1000km)'},
        'SHORT_HAUL': {'co2e_per_tkm': 850.0, 'description': 'Short-haul international (<3500km)'},
        'LONG_HAUL': {'co2e_per_tkm': 602.0, 'description': 'Long-haul international (>3500km)'},
        'BELLY': {'co2e_per_tkm': 480.0, 'description': 'Belly cargo (passenger aircraft)'},
        'DEFAULT': {'co2e_per_tkm': 850.0, 'description': 'Default air freight'}
    },
    
    # Sea Transport
    'SEA': {
        'CONTAINER_SMALL': {'co2e_per_tkm': 16.0, 'description': 'Small container ship (<1000 TEU)'},
        'CONTAINER_MEDIUM': {'co2e_per_tkm': 11.0, 'description': 'Medium container ship (1000-5000 TEU)'},
        'CONTAINER_LARGE': {'co2e_per_tkm': 8.0, 'description': 'Large container ship (>5000 TEU)'},
        'BULK': {'co2e_per_tkm': 5.0, 'description': 'Bulk carrier'},
        'TANKER': {'co2e_per_tkm': 6.0, 'description': 'Tanker vessel'},
        'DEFAULT': {'co2e_per_tkm': 11.0, 'description': 'Default sea freight'}
    },
    
    # Multimodal defaults
    'COURIER': {'DEFAULT': {'co2e_per_tkm': 180.0, 'description': 'Express courier/parcel'}},
    'LAST_MILE': {'DEFAULT': {'co2e_per_tkm': 250.0, 'description': 'Last-mile delivery'}}
}

# Fuel types and their emission factors (kg CO2e per liter)
FUEL_EMISSION_FACTORS = {
    'DIESEL': 2.68,
    'PETROL': 2.31,
    'CNG': 1.93,
    'LNG': 2.55,
    'ELECTRIC': 0.0,  # Upstream emissions calculated separately
    'HVO': 0.27,  # Hydrotreated Vegetable Oil (renewable diesel)
    'BIODIESEL_B20': 2.14
}


class EmissionsCalculator:
    """
    Calculate carbon emissions for freight shipments
    GLEC Framework v3.0 compliant
    """
    
    def __init__(self):
        self.default_mode = 'ROAD'
        self.default_vehicle = 'HCV'
    
    def calculate_shipment_emissions(
        self,
        weight_kg: float,
        distance_km: float,
        mode: str = 'ROAD',
        vehicle_type: str = None,
        fuel_type: str = None
    ) -> Dict:
        """
        Calculate CO2e emissions for a single shipment
        
        Args:
            weight_kg: Weight of goods in kilograms
            distance_km: Distance traveled in kilometers
            mode: Transport mode (ROAD, RAIL, AIR, SEA)
            vehicle_type: Specific vehicle type within mode
            fuel_type: Optional fuel type for accuracy
            
        Returns:
            Dict with emissions breakdown
        """
        mode_upper = mode.upper()
        weight_tonnes = weight_kg / 1000
        
        # Get emission factor
        mode_factors = EMISSION_FACTORS.get(mode_upper, EMISSION_FACTORS['ROAD'])
        
        if vehicle_type:
            vehicle_info = mode_factors.get(vehicle_type.upper(), mode_factors.get('DEFAULT'))
        else:
            vehicle_info = mode_factors.get('DEFAULT')
        
        co2e_per_tkm = vehicle_info['co2e_per_tkm']
        
        # Calculate tonne-kilometers
        tonne_km = weight_tonnes * distance_km
        
        # Calculate emissions (grams to kg)
        emissions_grams = tonne_km * co2e_per_tkm
        emissions_kg = emissions_grams / 1000
        emissions_tonnes = emissions_kg / 1000
        
        # Calculate fuel consumption estimate (for road)
        fuel_liters = None
        if mode_upper == 'ROAD' and fuel_type:
            # Approximate fuel consumption based on emissions
            fuel_factor = FUEL_EMISSION_FACTORS.get(fuel_type.upper(), FUEL_EMISSION_FACTORS['DIESEL'])
            if fuel_factor > 0:
                fuel_liters = emissions_kg / fuel_factor
        
        return {
            'success': True,
            'weight_kg': weight_kg,
            'weight_tonnes': round(weight_tonnes, 3),
            'distance_km': distance_km,
            'tonne_km': round(tonne_km, 2),
            'mode': mode_upper,
            'vehicle_type': vehicle_type or 'DEFAULT',
            'vehicle_description': vehicle_info['description'],
            'emission_factor_grams_per_tkm': co2e_per_tkm,
            'co2e_grams': round(emissions_grams, 2),
            'co2e_kg': round(emissions_kg, 3),
            'co2e_tonnes': round(emissions_tonnes, 6),
            'fuel_liters_estimated': round(fuel_liters, 2) if fuel_liters else None,
            'methodology': 'GLEC Framework v3.0',
            'calculated_at': datetime.now().isoformat()
        }
    
    def calculate_route_emissions(self, legs: List[Dict]) -> Dict:
        """
        Calculate emissions for a multi-leg route
        
        Args:
            legs: List of legs with {weight_kg, distance_km, mode, vehicle_type}
        """
        total_emissions = 0
        total_distance = 0
        total_tonne_km = 0
        leg_results = []
        
        for i, leg in enumerate(legs):
            leg_result = self.calculate_shipment_emissions(
                weight_kg=leg.get('weight_kg', 0),
                distance_km=leg.get('distance_km', 0),
                mode=leg.get('mode', 'ROAD'),
                vehicle_type=leg.get('vehicle_type')
            )
            
            if leg_result['success']:
                total_emissions += leg_result['co2e_kg']
                total_distance += leg.get('distance_km', 0)
                total_tonne_km += leg_result['tonne_km']
                leg_results.append({
                    'leg_number': i + 1,
                    **leg_result
                })
        
        # Calculate emissions intensity
        emissions_intensity = total_emissions / total_tonne_km if total_tonne_km > 0 else 0
        
        return {
            'success': True,
            'total_legs': len(legs),
            'total_distance_km': round(total_distance, 2),
            'total_tonne_km': round(total_tonne_km, 2),
            'total_co2e_kg': round(total_emissions, 3),
            'total_co2e_tonnes': round(total_emissions / 1000, 6),
            'emissions_intensity_kg_per_tkm': round(emissions_intensity, 4),
            'legs': leg_results,
            'methodology': 'GLEC Framework v3.0'
        }
    
    def compare_modes(
        self,
        weight_kg: float,
        distance_km: float
    ) -> Dict:
        """
        Compare emissions across different transport modes
        """
        modes_to_compare = ['ROAD', 'RAIL', 'AIR', 'SEA']
        comparisons = []
        
        for mode in modes_to_compare:
            result = self.calculate_shipment_emissions(
                weight_kg=weight_kg,
                distance_km=distance_km,
                mode=mode
            )
            
            comparisons.append({
                'mode': mode,
                'co2e_kg': result['co2e_kg'],
                'emission_factor': result['emission_factor_grams_per_tkm']
            })
        
        # Sort by emissions (lowest first)
        comparisons.sort(key=lambda x: x['co2e_kg'])
        
        # Calculate savings vs highest emitter
        highest = comparisons[-1]['co2e_kg']
        for comp in comparisons:
            comp['savings_vs_highest_kg'] = round(highest - comp['co2e_kg'], 3)
            comp['savings_vs_highest_percent'] = round((highest - comp['co2e_kg']) / highest * 100, 1) if highest > 0 else 0
        
        return {
            'weight_kg': weight_kg,
            'distance_km': distance_km,
            'comparisons': comparisons,
            'recommended_mode': comparisons[0]['mode'],
            'potential_savings_kg': comparisons[0]['savings_vs_highest_kg']
        }


class CarrierEmissionsScorecard:
    """
    Score carriers based on their emissions performance
    """
    
    def __init__(self):
        self.calculator = EmissionsCalculator()
    
    def calculate_carrier_score(
        self,
        carrier_id: str,
        carrier_name: str,
        shipments: List[Dict]
    ) -> Dict:
        """
        Calculate emissions scorecard for a carrier
        
        Args:
            carrier_id: Unique carrier identifier
            carrier_name: Carrier name
            shipments: List of shipments with emissions data
        """
        if not shipments:
            return {'success': False, 'error': 'No shipments provided'}
        
        total_emissions = 0
        total_tonne_km = 0
        total_shipments = len(shipments)
        
        for shipment in shipments:
            total_emissions += shipment.get('co2e_kg', 0)
            total_tonne_km += shipment.get('tonne_km', 0)
        
        # Calculate intensity (kg CO2e per tonne-km)
        intensity = total_emissions / total_tonne_km if total_tonne_km > 0 else 0
        
        # Industry benchmark (GLEC average for road freight: 62 g/tkm = 0.062 kg/tkm)
        benchmark = 0.062
        
        # Calculate score (100 = benchmark, higher = cleaner)
        if intensity > 0:
            score = min(150, max(0, (benchmark / intensity) * 100))
        else:
            score = 100
        
        # Grade assignment
        if score >= 120:
            grade = 'A+'
            status = 'Excellent - Well below industry average'
        elif score >= 100:
            grade = 'A'
            status = 'Good - At or below industry average'
        elif score >= 80:
            grade = 'B'
            status = 'Average - Slightly above industry average'
        elif score >= 60:
            grade = 'C'
            status = 'Below Average - Improvement needed'
        else:
            grade = 'D'
            status = 'Poor - Significant improvement required'
        
        return {
            'success': True,
            'carrier_id': carrier_id,
            'carrier_name': carrier_name,
            'total_shipments': total_shipments,
            'total_tonne_km': round(total_tonne_km, 2),
            'total_co2e_kg': round(total_emissions, 3),
            'emissions_intensity_kg_per_tkm': round(intensity, 6),
            'industry_benchmark_kg_per_tkm': benchmark,
            'score': round(score, 1),
            'grade': grade,
            'status': status,
            'calculated_at': datetime.now().isoformat()
        }


class ESGReporter:
    """
    Generate ESG (Environmental, Social, Governance) reports
    """
    
    def __init__(self):
        self.calculator = EmissionsCalculator()
    
    def generate_scope3_report(
        self,
        company_name: str,
        reporting_period: str,
        shipments: List[Dict]
    ) -> Dict:
        """
        Generate Scope 3 (transportation) emissions report
        """
        total_emissions_kg = 0
        emissions_by_mode = {'ROAD': 0, 'RAIL': 0, 'AIR': 0, 'SEA': 0, 'OTHER': 0}
        
        for shipment in shipments:
            mode = shipment.get('mode', 'ROAD').upper()
            emissions = shipment.get('co2e_kg', 0)
            
            total_emissions_kg += emissions
            if mode in emissions_by_mode:
                emissions_by_mode[mode] += emissions
            else:
                emissions_by_mode['OTHER'] += emissions
        
        total_tonnes = total_emissions_kg / 1000
        
        # Calculate percentage by mode
        mode_percentages = {}
        for mode, emissions in emissions_by_mode.items():
            pct = (emissions / total_emissions_kg * 100) if total_emissions_kg > 0 else 0
            mode_percentages[mode] = {
                'emissions_kg': round(emissions, 2),
                'emissions_tonnes': round(emissions / 1000, 4),
                'percentage': round(pct, 1)
            }
        
        return {
            'success': True,
            'report_type': 'Scope 3 Transportation Emissions',
            'company_name': company_name,
            'reporting_period': reporting_period,
            'total_shipments': len(shipments),
            'total_emissions_kg': round(total_emissions_kg, 2),
            'total_emissions_tonnes': round(total_tonnes, 4),
            'emissions_by_mode': mode_percentages,
            'framework': 'GHG Protocol Scope 3 Category 4 & 9',
            'methodology': 'GLEC Framework v3.0',
            'generated_at': datetime.now().isoformat()
        }


# Singleton instances
emissions_calculator = EmissionsCalculator()
carrier_scorecard = CarrierEmissionsScorecard()
esg_reporter = ESGReporter()


# Convenience functions for API
def calculate_emissions(weight_kg: float, distance_km: float, mode: str = 'ROAD', vehicle_type: str = None) -> Dict:
    return emissions_calculator.calculate_shipment_emissions(weight_kg, distance_km, mode, vehicle_type)

def calculate_route(legs: List[Dict]) -> Dict:
    return emissions_calculator.calculate_route_emissions(legs)

def compare_transport_modes(weight_kg: float, distance_km: float) -> Dict:
    return emissions_calculator.compare_modes(weight_kg, distance_km)

def get_carrier_emissions_score(carrier_id: str, carrier_name: str, shipments: List[Dict]) -> Dict:
    return carrier_scorecard.calculate_carrier_score(carrier_id, carrier_name, shipments)

def generate_esg_report(company_name: str, period: str, shipments: List[Dict]) -> Dict:
    return esg_reporter.generate_scope3_report(company_name, period, shipments)

def get_emission_factors() -> Dict:
    return EMISSION_FACTORS
