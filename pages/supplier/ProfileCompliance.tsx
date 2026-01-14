import React, { useState } from 'react';
import { IndianSupplier } from '../../services/supplierService';
import { supplierDocumentService, SupplierDocument } from '../../services/supplierDocumentService';
import { pdfGenerator } from '../../services/pdfGenerator';

// Rotating 3D Cube Animation CSS
const cubeStyles = `
@keyframes rotateCube {
    0% { transform: rotateX(-20deg) rotateY(0deg); }
    100% { transform: rotateX(-20deg) rotateY(360deg); }
}
`;

// IBM Blue color
const IBM_BLUE = '#0062FF';

// Rubik's Cube Face - 3x3 grid pattern
const CubeFace: React.FC<{ transform: string; size: number }> = ({ transform, size }) => {
    const cellSize = size / 3;
    const gap = 2;
    return (
        <div style={{
            position: 'absolute',
            width: size,
            height: size,
            transform,
            display: 'grid',
            gridTemplateColumns: `repeat(3, 1fr)`,
            gap: `${gap}px`,
            padding: `${gap}px`,
            backgroundColor: '#111',
            boxSizing: 'border-box'
        }}>
            {[...Array(9)].map((_, i) => (
                <div key={i} style={{
                    backgroundColor: IBM_BLUE,
                    borderRadius: '2px',
                    boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3)'
                }} />
            ))}
        </div>
    );
};

// 3D Rotating Rubik's Cube Component - Solid IBM Blue
const RotatingCube: React.FC<{ size?: number }> = ({ size = 60 }) => {
    const cubeSize = size * 0.7;
    const halfSize = cubeSize / 2;

    return (
        <>
            <style>{cubeStyles}</style>
            <div style={{
                width: size,
                height: size,
                perspective: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div style={{
                    width: cubeSize,
                    height: cubeSize,
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    animation: 'rotateCube 10s linear infinite'
                }}>
                    {/* Front */}
                    <CubeFace size={cubeSize} transform={`translateZ(${halfSize}px)`} />
                    {/* Back */}
                    <CubeFace size={cubeSize} transform={`rotateY(180deg) translateZ(${halfSize}px)`} />
                    {/* Right */}
                    <CubeFace size={cubeSize} transform={`rotateY(90deg) translateZ(${halfSize}px)`} />
                    {/* Left */}
                    <CubeFace size={cubeSize} transform={`rotateY(-90deg) translateZ(${halfSize}px)`} />
                    {/* Top */}
                    <CubeFace size={cubeSize} transform={`rotateX(90deg) translateZ(${halfSize}px)`} />
                    {/* Bottom */}
                    <CubeFace size={cubeSize} transform={`rotateX(-90deg) translateZ(${halfSize}px)`} />
                </div>
            </div>
        </>
    );
};


// Small 3D Icons
const Icon3DCheck: React.FC<{ size?: number; color?: string }> = ({ size = 16, color = '#00C805' }) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="9" fill={color} />
        <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

const Icon3DDoc: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#0052FF' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M6 2h8l6 6v14H6V2z" fill={color} />
        <path d="M14 2v6h6" fill={color} fillOpacity="0.4" />
        <rect x="8" y="12" width="8" height="1.5" rx="0.75" fill="white" fillOpacity="0.6" />
        <rect x="8" y="15" width="6" height="1.5" rx="0.75" fill="white" fillOpacity="0.6" />
    </svg>
);

const Icon3DUpload: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#FFF' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <rect x="4" y="14" width="16" height="8" rx="2" fill={color} fillOpacity="0.2" />
        <path d="M12 2v12M8 6l4-4 4 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

interface ProfileComplianceProps {
    supplier: IndianSupplier;
}

export const ProfileCompliance: React.FC<ProfileComplianceProps> = ({ supplier }) => {
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<SupplierDocument | null>(null);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [uploadCategory, setUploadCategory] = useState<any>('COMPLIANCE');
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploadName, setUploadName] = useState('');

    const getDocBlob = async (doc: SupplierDocument): Promise<Blob> => {
        try {
            const realFile = await supplierDocumentService.getDocumentFile(doc.id);
            if (realFile) return realFile;
        } catch (e) {
            console.error("Backend Fetch Error:", e);
        }
        if (doc.category === 'COMPLIANCE') {
            if (doc.name.includes('GST')) return pdfGenerator.generateGSTCertificate(supplier.name, supplier.gstin, doc.uploadDate);
            if (doc.name.includes('PAN')) return pdfGenerator.generatePANCard(supplier.name, 'AABCT1234F');
        }
        const content = { "Document ID": doc.id, "Uploaded On": doc.uploadDate, "Category": doc.category, "Status": doc.status };
        return pdfGenerator.generateGenericDoc(doc.name, content);
    };

    const handleDownload = async (doc: SupplierDocument) => {
        try {
            const blob = await getDocBlob(doc);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${doc.name.replace(/\s+/g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (e) {
            alert("Failed to download document.");
        }
    };

    const handleView = (doc: SupplierDocument) => {
        setSelectedDocument(doc);
        setPdfUrl(`http://localhost:5000/api/documents/${doc.id}/view`);
    };

    const handleUploadSubmit = async () => {
        if (!uploadFile || !uploadName) {
            alert("Please select a file and enter a document name.");
            return;
        }
        const newDoc: SupplierDocument = {
            id: `SUP-DOC-${Math.floor(Math.random() * 10000)}`,
            name: uploadName,
            category: uploadCategory,
            status: 'PENDING_VERIFICATION',
            uploadDate: new Date().toISOString().split('T')[0],
            fileUrl: '',
            fileSize: `${(uploadFile.size / 1024).toFixed(1)} KB`,
            description: 'Uploaded via Portal',
        };
        try {
            await supplierDocumentService.uploadDocument(newDoc, uploadFile);
            setIsUploadModalOpen(false);
            setUploadName('');
            setUploadFile(null);
        } catch (e) {
            alert("Upload failed: " + e);
        }
    };

    const handleCloseModal = () => {
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
        setSelectedDocument(null);
    };

    const documents = supplierDocumentService.getDocumentsByCategory('COMPLIANCE').slice(0, 6);

    // Stats for profile
    const stats = [
        { label: 'Total Trips', value: '156', color: '#FFF' },
        { label: 'On-Time Rate', value: '97.2%', color: '#00C805' },
        { label: 'Active Since', value: 'Mar 2022', color: '#FFF' },
        { label: 'Rating', value: '4.8/5', color: '#FFB800' }
    ];

    return (
        <div style={{ backgroundColor: '#000000', minHeight: '100vh', padding: '32px' }}>

            {/* ============================================
                HEADER CARD - Cash App Style
               ============================================ */}
            <div style={{
                backgroundColor: '#0D0D0D',
                borderRadius: '24px',
                padding: '32px',
                marginBottom: '24px',
                border: '1px solid #1A1A1A'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        {/* ROTATING 3D CUBE - Replaces green TC box */}
                        <RotatingCube size={80} />

                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                                <h1 style={{ color: '#FFFFFF', fontSize: '28px', fontWeight: 600, margin: 0 }}>
                                    {supplier.name}
                                </h1>
                                <span style={{
                                    backgroundColor: '#1A1A1A',
                                    color: '#00C805',
                                    fontSize: '10px',
                                    fontWeight: 600,
                                    padding: '6px 12px',
                                    borderRadius: '20px',
                                    border: '1px solid #00C805',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }}>
                                    <Icon3DCheck size={12} color="#00C805" /> VERIFIED
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                <span style={{ color: '#666', fontSize: '12px' }}>
                                    GSTIN: <span style={{ color: '#FFF' }}>{supplier.gstin}</span>
                                </span>
                                <span style={{ color: '#666', fontSize: '12px' }}>
                                    MSME: <span style={{ color: '#FFF' }}>UDYAM-MH-0012</span>
                                </span>
                                <span style={{ color: '#666', fontSize: '12px' }}>
                                    Contact: <span style={{ color: '#FFF' }}>{supplier.contacts[0].name}</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            style={{
                                backgroundColor: '#FFF',
                                color: '#000',
                                border: 'none',
                                padding: '12px 20px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}
                        >
                            <Icon3DUpload size={16} color="#000" /> Upload
                        </button>
                        <button style={{
                            backgroundColor: 'transparent',
                            color: '#FFF',
                            border: '1px solid #333',
                            padding: '12px 20px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                        }}>
                            Edit Profile
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1A1A1A' }}>
                    {stats.map((stat, i) => (
                        <div key={i}>
                            <span style={{ color: '#666', fontSize: '11px', textTransform: 'uppercase' }}>{stat.label}</span>
                            <p style={{ color: stat.color, fontSize: '20px', fontWeight: 600, margin: '4px 0 0' }}>{stat.value}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ============================================
                MAIN GRID - Compliance & Documents
               ============================================ */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>

                {/* Compliance Score - Minimalist */}
                <div style={{
                    backgroundColor: '#0D0D0D',
                    borderRadius: '24px',
                    padding: '32px',
                    textAlign: 'center',
                    border: '1px solid #1A1A1A'
                }}>
                    <h3 style={{ color: '#FFF', fontSize: '14px', fontWeight: 600, margin: '0 0 24px' }}>Compliance Score</h3>

                    <div style={{ position: 'relative', width: '140px', height: '140px', margin: '0 auto 20px' }}>
                        <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="70" cy="70" r="60" stroke="#1A1A1A" strokeWidth="10" fill="none" />
                            <circle cx="70" cy="70" r="60" stroke="#0052FF" strokeWidth="10" fill="none"
                                strokeDasharray="377" strokeDashoffset="38" strokeLinecap="round" />
                        </svg>
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)', textAlign: 'center'
                        }}>
                            <span style={{ color: '#FFFFFF', fontSize: '36px', fontWeight: 700, display: 'block' }}>90</span>
                            <span style={{ color: '#666', fontSize: '11px' }}>/ 100</span>
                        </div>
                    </div>

                    <span style={{ color: '#0052FF', fontSize: '14px', fontWeight: 600 }}>Excellent</span>
                    <p style={{ color: '#666', fontSize: '11px', margin: '8px 0 0' }}>Next audit in 45 days</p>

                    {/* Quick Stats */}
                    <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid #1A1A1A' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: '#666', fontSize: '11px' }}>Documents</span>
                            <span style={{ color: '#FFF', fontSize: '11px', fontWeight: 600 }}>12 / 14</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                            <span style={{ color: '#666', fontSize: '11px' }}>Expiring Soon</span>
                            <span style={{ color: '#FFB800', fontSize: '11px', fontWeight: 600 }}>2</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#666', fontSize: '11px' }}>Pending</span>
                            <span style={{ color: '#0052FF', fontSize: '11px', fontWeight: 600 }}>1</span>
                        </div>
                    </div>
                </div>

                {/* Document Vault */}
                <div style={{
                    backgroundColor: '#0D0D0D',
                    borderRadius: '24px',
                    padding: '32px',
                    border: '1px solid #1A1A1A'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Icon3DDoc size={20} color="#0052FF" />
                            <span style={{ color: '#FFFFFF', fontSize: '14px', fontWeight: 600 }}>Document Vault</span>
                        </div>
                        <span style={{ color: '#0052FF', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>View All →</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {documents.map(doc => {
                            const isActive = doc.status === 'ACTIVE';
                            const isExpiring = doc.status === 'EXPIRING';
                            const isPending = doc.status === 'PENDING_VERIFICATION';

                            return (
                                <div
                                    key={doc.id}
                                    onClick={() => handleView(doc)}
                                    style={{
                                        backgroundColor: '#111',
                                        borderRadius: '12px',
                                        padding: '14px 18px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        border: isExpiring ? '1px solid #FF4444' : '1px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#1A1A1A';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#111';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <Icon3DDoc size={28} color={isActive ? '#00C805' : isPending ? '#0052FF' : '#FF4444'} />
                                        <div>
                                            <p style={{ color: '#FFFFFF', fontSize: '13px', fontWeight: 500, margin: '0 0 2px' }}>{doc.name}</p>
                                            <p style={{ color: '#666', fontSize: '10px', margin: 0 }}>
                                                {doc.metadata?.validForever ? 'No expiry' : `Uploaded: ${doc.uploadDate}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {isExpiring && (
                                            <button style={{
                                                backgroundColor: '#FF4444',
                                                color: '#FFF',
                                                border: 'none',
                                                padding: '6px 12px',
                                                borderRadius: '6px',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                cursor: 'pointer'
                                            }}>
                                                Renew
                                            </button>
                                        )}
                                        <span style={{
                                            backgroundColor: isActive ? 'rgba(0,200,5,0.1)' : isPending ? 'rgba(0,82,255,0.1)' : 'rgba(255,68,68,0.1)',
                                            color: isActive ? '#00C805' : isPending ? '#0052FF' : '#FF4444',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            padding: '5px 10px',
                                            borderRadius: '6px'
                                        }}>
                                            {isActive && 'Active'}
                                            {isPending && 'Pending'}
                                            {isExpiring && 'Expiring'}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Upload Modal */}
            {isUploadModalOpen && (
                <div style={{
                    position: 'fixed', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100
                }} onClick={() => setIsUploadModalOpen(false)}>
                    <div style={{
                        backgroundColor: '#111',
                        borderRadius: '24px',
                        padding: '28px',
                        width: '100%',
                        maxWidth: '440px',
                        border: '1px solid #222'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <span style={{ color: '#FFF', fontSize: '16px', fontWeight: 600 }}>Upload Document</span>
                            <button onClick={() => setIsUploadModalOpen(false)} style={{
                                backgroundColor: '#222', border: 'none',
                                width: '28px', height: '28px', borderRadius: '8px',
                                color: '#FFF', cursor: 'pointer', fontSize: '14px'
                            }}>×</button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ color: '#666', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                    Document Name
                                </label>
                                <input
                                    type="text"
                                    value={uploadName}
                                    onChange={(e) => setUploadName(e.target.value)}
                                    placeholder="e.g. GST Certificate 2024"
                                    style={{
                                        width: '100%', padding: '12px 14px',
                                        backgroundColor: '#0A0A0A', border: '1px solid #222',
                                        borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ color: '#666', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
                                    Category
                                </label>
                                <select
                                    value={uploadCategory}
                                    onChange={(e) => setUploadCategory(e.target.value)}
                                    style={{
                                        width: '100%', padding: '12px 14px',
                                        backgroundColor: '#0A0A0A', border: '1px solid #222',
                                        borderRadius: '10px', color: '#FFF', fontSize: '13px', outline: 'none'
                                    }}
                                >
                                    <option value="COMPLIANCE">Compliance</option>
                                    <option value="FINANCIAL">Financial</option>
                                    <option value="VEHICLE">Vehicle</option>
                                    <option value="DRIVER">Driver</option>
                                    <option value="INSURANCE">Insurance</option>
                                </select>
                            </div>

                            <div style={{
                                border: '1px dashed #333', borderRadius: '12px',
                                padding: '28px', textAlign: 'center',
                                position: 'relative', cursor: 'pointer'
                            }}>
                                <input
                                    type="file"
                                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
                                    onChange={(e) => setUploadFile(e.target.files ? e.target.files[0] : null)}
                                />
                                {uploadFile ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                        <Icon3DDoc size={24} color="#00C805" />
                                        <div style={{ textAlign: 'left' }}>
                                            <p style={{ color: '#FFF', fontSize: '12px', fontWeight: 500, margin: 0 }}>{uploadFile.name}</p>
                                            <p style={{ color: '#666', fontSize: '10px', margin: 0 }}>{(uploadFile.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <Icon3DUpload size={28} color="#666" />
                                        <p style={{ color: '#FFF', fontSize: '12px', margin: '10px 0 2px' }}>Click to Upload</p>
                                        <p style={{ color: '#666', fontSize: '10px', margin: 0 }}>PDF, JPG, PNG (Max 5MB)</p>
                                    </>
                                )}
                            </div>

                            <button
                                onClick={handleUploadSubmit}
                                style={{
                                    backgroundColor: '#FFF', color: '#000',
                                    border: 'none', padding: '14px',
                                    borderRadius: '10px', fontSize: '13px',
                                    fontWeight: 600, cursor: 'pointer', width: '100%'
                                }}
                            >
                                Submit for Verification
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Document Preview Modal */}
            {selectedDocument && (
                <div style={{
                    position: 'fixed', inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.9)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 100
                }} onClick={handleCloseModal}>
                    <div style={{
                        backgroundColor: '#111',
                        borderRadius: '20px',
                        width: '90%', maxWidth: '900px',
                        height: '85vh',
                        display: 'flex', flexDirection: 'column',
                        overflow: 'hidden', border: '1px solid #222'
                    }} onClick={e => e.stopPropagation()}>
                        <div style={{
                            padding: '16px 20px',
                            borderBottom: '1px solid #222',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <Icon3DDoc size={20} color="#0052FF" />
                                <div>
                                    <p style={{ color: '#FFF', fontSize: '14px', fontWeight: 500, margin: 0 }}>{selectedDocument.name}</p>
                                    <span style={{ color: '#666', fontSize: '10px' }}>{selectedDocument.status}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => handleDownload(selectedDocument)}
                                    style={{
                                        backgroundColor: '#FFF', color: '#000',
                                        border: 'none', padding: '8px 14px',
                                        borderRadius: '8px', fontSize: '11px',
                                        fontWeight: 600, cursor: 'pointer'
                                    }}
                                >
                                    Download
                                </button>
                                <button
                                    onClick={handleCloseModal}
                                    style={{
                                        backgroundColor: '#222', border: 'none',
                                        width: '32px', height: '32px', borderRadius: '8px',
                                        color: '#FFF', cursor: 'pointer', fontSize: '14px'
                                    }}
                                >×</button>
                            </div>
                        </div>
                        <div style={{ flex: 1, backgroundColor: '#0A0A0A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {pdfUrl ? (
                                <iframe
                                    src={pdfUrl}
                                    style={{ width: '100%', height: '100%', border: 'none', backgroundColor: '#FFF' }}
                                    title="Document Preview"
                                />
                            ) : (
                                <p style={{ color: '#666' }}>Document preview unavailable.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
