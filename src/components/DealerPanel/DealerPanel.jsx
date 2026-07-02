import React, { useState, useRef } from 'react';
import { useGame } from '../../context/GameContext';
import { supabase } from '../../supabaseClient';
import { Camera, Send, X, Smartphone, History, Trash2, Clock } from 'lucide-react';

const DealerPanel = () => {
  const { players, dealtCards, recordDealtCards, clearDealtCards } = useGame();
  const [selectedPlayer, setSelectedPlayer] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Rear camera preferred
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("No se pudo acceder a la cámara.");
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    setCameraActive(false);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
      const imageUrl = canvasRef.current.toDataURL('image/jpeg');
      setPhoto(imageUrl);
      stopCamera();
    }
  };

  const sendToWhatsApp = async () => {
    if (!selectedPlayer || !photo) return;
    setSending(true);

    const player = players.find(p => p.id === Number(selectedPlayer));
    
    if (!supabase) {
      // Simulation mode
      setTimeout(() => {
        setSending(false);
        recordDealtCards(player.id, player.name, photo);
        alert(`(Modo Simulación) ¡Cartas enviadas por WhatsApp a ${player?.name}!`);
        setPhoto(null);
        setSelectedPlayer('');
      }, 1500);
      return;
    }

    try {
      // 1. Convert base64 to Blob
      const res = await fetch(photo);
      const blob = await res.blob();
      const fileName = `cards_${player.id}_${Date.now()}.jpg`;

      // 2. Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('card-photos')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw new Error("Error al subir foto: " + uploadError.message);

      // 3. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('card-photos')
        .getPublicUrl(fileName);

      // 4. Call Edge Function to send WhatsApp
      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: { 
          phone: player.phone, 
          imageUrl: publicUrl,
          message: `Hola ${player.name}, aquí están tus cartas para esta ronda.` 
        }
      });

      if (error) throw new Error("Error al enviar WhatsApp: " + error.message);

      recordDealtCards(player.id, player.name, publicUrl);
      alert(`¡Cartas enviadas por WhatsApp a ${player.name} exitosamente!`);
      setPhoto(null);
      setSelectedPlayer('');
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h2 className="text-gradient-green" style={{ textAlign: 'center', marginBottom: '2rem' }}>Panel de Dealer (Repartidor)</h2>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div className="input-group">
          <label>1. Seleccionar Jugador (Destinatario)</label>
          <select 
            className="input-field" 
            value={selectedPlayer} 
            onChange={(e) => setSelectedPlayer(e.target.value)}
          >
            <option value="">-- Elija el jugador al que repartirá --</option>
            {players.map(p => (
              <option key={p.id} value={p.id}>
                Asiento {p.position}: {p.name} ({p.phone})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginTop: '2rem' }}>
          <label style={{ display: 'block', marginBottom: '1rem', color: 'var(--text-muted)' }}>
            2. Escanear Cartas
          </label>
          
          {!cameraActive && !photo && (
            <button 
              className="btn btn-secondary pulse-primary" 
              style={{ width: '100%', height: '200px', display: 'flex', flexDirection: 'column', gap: '1rem' }}
              onClick={startCamera}
              disabled={!selectedPlayer}
            >
              <Camera size={48} className="text-gradient" />
              <span>Activar Cámara</span>
            </button>
          )}

          {cameraActive && (
            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                style={{ width: '100%', backgroundColor: '#000' }}
              />
              <button 
                className="btn btn-primary" 
                style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)' }}
                onClick={takePhoto}
              >
                Capturar Cartas
              </button>
            </div>
          )}

          {photo && (
            <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
              <img src={photo} alt="Cartas Capturadas" style={{ width: '100%', display: 'block' }} />
              <button 
                className="btn btn-secondary btn-icon" 
                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(0,0,0,0.5)' }}
                onClick={() => setPhoto(null)}
              >
                <X size={20} />
              </button>
            </div>
          )}
          
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {photo && (
          <div style={{ marginTop: '2rem' }}>
            <button 
              className="btn btn-primary" 
              style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #059669)' }}
              onClick={sendToWhatsApp}
              disabled={sending}
            >
              {sending ? (
                <span>Enviando...</span>
              ) : (
                <>
                  <Smartphone size={20} />
                  Enviar al WhatsApp
                </>
              )}
            </button>
          </div>
        )}
        
        {/* History Buttons */}
        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            onClick={() => setShowHistory(true)}
          >
            <History size={18} />
            Historial de Ronda
          </button>
          <button 
            className="btn btn-secondary" 
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#f87171' }}
            onClick={() => {
              if(window.confirm("¿Estás seguro de borrar el historial de esta ronda?")) {
                clearDealtCards();
              }
            }}
          >
            <Trash2 size={18} />
            Nueva Ronda
          </button>
        </div>
      </div>

      {/* Card History Modal */}
      {showHistory && (
        <div className="modal-overlay flex-center" style={{ padding: '1rem' }}>
          <div className="modal-content glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex-between" style={{ marginBottom: '1.5rem', position: 'sticky', top: 0, background: 'var(--bg-surface)', padding: '1rem 0', zIndex: 10 }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <History size={20} className="text-gradient" />
                Historial de Cartas
              </h3>
              <button className="btn-icon" onClick={() => setShowHistory(false)} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            
            {dealtCards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)' }}>
                <Clock size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No se han repartido cartas en esta ronda.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
                {dealtCards.map(record => (
                  <div key={record.id} className="glass-panel" style={{ padding: '0.5rem', overflow: 'hidden' }}>
                    <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--glass-border)', marginBottom: '0.5rem' }}>
                      <div style={{ fontWeight: '600' }}>{record.playerName}</div>
                      <div className="text-muted" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {record.timestamp}
                      </div>
                    </div>
                    <img 
                      src={record.imageUrl} 
                      alt={`Cartas de ${record.playerName}`} 
                      style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} 
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DealerPanel;
