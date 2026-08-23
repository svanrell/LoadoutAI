"use client";

import { useValorantData, Weapon } from "@/hooks/useValorantData";
import { useGameState } from "@/hooks/useGameState";
import { useState } from "react";

export default function ViewIngame() {
  const { agents, weapons } = useValorantData();
  const { myTeam, myCredits, buyPhaseAvailable } = useGameState();
  const [hoveredWeapon, setHoveredWeapon] = useState<Weapon | null>(null);

  const myAgentId = myTeam[0]?.agentId || "add6443a-41bd-e414-f6ad-e58d267f4e95"; // Jett UUID as fallback
  const myAgent = agents.find(a => a.uuid.toLowerCase() === myAgentId);
  const myAgentIcon = myAgent?.displayIcon || 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-1b6c-968525494517/displayicon.png';
  const myAbilities = myAgent?.abilities || [];

  const basicAbilities = myAbilities.filter(a => a.slot !== 'Ultimate').slice(0, 3);

  const banditWeapon: Weapon = {
      uuid: 'bandit-mock',
      displayName: 'BANDIT',
      category: 'EEquippableCategory::Sidearm',
      displayIcon: 'https://media.valorant-api.com/weapons/44d4e95c-4157-0037-81b2-17841bf2e8e3/displayicon.png', 
      shopData: { cost: 600, category: 'Sidearms', categoryText: 'Arma de Mano' },
      weaponStats: {
          fireRate: 8.5,
          magazineSize: 12,
          equipTimeSeconds: 0.75,
          reloadTimeSeconds: 1.8,
          firstBulletAccuracy: 0.8,
          damageRanges: [
              { rangeStartMeters: 0, rangeEndMeters: 30, headDamage: 110, bodyDamage: 35, legDamage: 29 },
              { rangeStartMeters: 30, rangeEndMeters: 50, headDamage: 90, bodyDamage: 30, legDamage: 25 }
          ]
      }
  };

  const allWeapons = [...weapons, banditWeapon];

  const getWeaponStatus = (wName: string, cost: number) => {
      if (cost > myCredits) return "unaffordable";
      return "affordable";
  };

  const renderWeaponCol = (categories: {title: string, id: string}[]) => {
      return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, minWidth: '180px' }}>
              {categories.map((cat) => {
                  const groupWeapons = allWeapons.filter(w => w.category === cat.id && w.shopData);
                  
                  // Definimos el orden exacto de las armas según aparecen en Valorant
                  const exactOrder = [
                      "CLASSIC", "SHORTY", "FRENZY", "GHOST", "BANDIT", "SHERIFF", // Sidearms
                      "STINGER", "SPECTRE", // SMGs
                      "BUCKY", "JUDGE", // Shotguns
                      "BULLDOG", "GUARDIAN", "PHANTOM", "VANDAL", // Rifles
                      "MARSHAL", "OUTLAW", "OPERATOR", // Snipers
                      "ARES", "ODIN" // Heavy
                  ];

                  groupWeapons.sort((a, b) => {
                      const indexA = exactOrder.indexOf(a.displayName.toUpperCase());
                      const indexB = exactOrder.indexOf(b.displayName.toUpperCase());
                      
                      // Si ambos están en la lista, usamos ese orden
                      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                      // Si solo uno está, lo priorizamos
                      if (indexA !== -1) return -1;
                      if (indexB !== -1) return 1;
                      // Fallback al coste
                      return (a.shopData?.cost || 0) - (b.shopData?.cost || 0);
                  });
                                  return (
                      <div key={cat.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 900, color: '#f5f7fa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>{cat.title}</div>
                          {groupWeapons.map(w => {
                              if (!w.shopData) return null;
                              const status = getWeaponStatus(w.displayName, w.shopData.cost);
                              
                              const border = '1px solid rgba(255,255,255,0.15)';
                              const bg = 'rgba(20, 20, 20, 0.6)';
                              const color = status === 'unaffordable' ? 'var(--color-red)' : '#f5f7fa';
                              
                              const isClassic = w.displayName.toUpperCase() === 'CLASSIC';
                              const costDisplay = isClassic ? 'GRATIS' : `¤${w.shopData.cost}`;
                              const nameDisplay = isClassic ? 'CLASSIC' : w.displayName;
                              const statusLabel = isClassic ? 'COMPRADO' : '';

                              return (
                                  <div 
                                      key={w.uuid} 
                                      onMouseEnter={() => setHoveredWeapon(w)}
                                      onMouseLeave={() => setHoveredWeapon(null)}
                                      style={{ 
                                          border, background: bg, position: 'relative',
                                          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer',
                                          height: '65px', transition: 'background 0.2s'
                                      }}
                                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                                      onMouseOut={(e) => e.currentTarget.style.background = bg}
                                  >
                                      {statusLabel && (
                                          <div style={{ position: 'absolute', top: '15px', right: '10px', fontSize: '10px', color: 'var(--color-cyan)', fontWeight: 900, zIndex: 2 }}>{statusLabel}</div>
                                      )}
                                      <div style={{ position: 'absolute', bottom: '18px', right: '10px', fontSize: '10px', color, fontWeight: 900, zIndex: 2 }}>{costDisplay}</div>
                                      <div style={{ position: 'absolute', bottom: '6px', right: '10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#f5f7fa', zIndex: 2 }}>{nameDisplay}</div>
                                      <img src={w.displayIcon} alt={w.displayName} style={{ maxHeight: '40px', maxWidth: '60%', objectFit: 'contain', filter: status === 'unaffordable' ? 'grayscale(100%)' : 'none', position: 'absolute', top: '50%', left: '40%', transform: 'translate(-50%, -50%)', zIndex: 1 }} />
                                  </div>
                              );
                          })}
                      </div>
                  );
              })}
          </div>
      );
  };

  const renderArmorCol = () => {
      const armors = [
          { name: 'ARM. LIGERA', cost: 400, icon: 'https://media.valorant-api.com/gear/4dec83d5-4902-9ab3-bed6-a7a390761157/displayicon.png' },
          { name: 'ESCUDO REGEN.', cost: 650, icon: 'https://media.valorant-api.com/gear/b1b9086d-41bd-a516-5d29-e3b34a6f1644/displayicon.png' },
          { name: 'ARM. PESADA', cost: 1000, icon: 'https://media.valorant-api.com/gear/822bcab2-40a2-324e-c137-e09195ad7692/displayicon.png' }
      ];

      return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', flex: 1, minWidth: '130px' }}>
              <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 900, color: '#f5f7fa', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>ESCUDOS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {armors.map(a => {
                      const status = myCredits >= a.cost ? 'affordable' : 'unaffordable';
                      const color = status === 'unaffordable' ? 'var(--color-red)' : '#f5f7fa';
                      
                      return (
                          <div key={a.name} style={{ 
                              border: '1px solid rgba(255,255,255,0.15)', background: 'rgba(20, 20, 20, 0.6)', position: 'relative',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', cursor: 'pointer',
                              height: '110px'
                          }}
                          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(20, 20, 20, 0.6)'}
                          >
                              <div style={{ position: 'absolute', bottom: '20px', right: '10px', fontSize: '10px', color, fontWeight: 900, zIndex: 2 }}>¤{a.cost}</div>
                              <div style={{ position: 'absolute', bottom: '6px', right: '10px', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#f5f7fa', zIndex: 2 }}>{a.name}</div>
                              <img src={a.icon} alt={a.name} style={{ maxHeight: '60px', maxWidth: '60%', objectFit: 'contain', filter: status === 'unaffordable' ? 'grayscale(100%)' : 'none', position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 1 }} />
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  const [forceShow, setForceShow] = useState(false);

  if (!buyPhaseAvailable && !forceShow) {
      return (
          <div id="viewIngame" className="state-view active" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%', background: 'rgba(0,0,0,0.8)' }}>
              <h2 style={{ fontFamily: "'Orbitron', sans-serif" }}>Ronda en progreso...</h2>
              <button 
                  onClick={() => setForceShow(true)}
                  style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--color-cyan)', color: '#000', border: 'none', cursor: 'pointer', fontWeight: 900, fontFamily: "'Orbitron', sans-serif" }}
              >
                  VER MENÚ DE COMPRA (OFFLINE)
              </button>
          </div>
      );
  }

  return (
    <div id="viewIngame" className="state-view active" style={{ 
        display: 'flex', 
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        background: 'url(https://media.valorant-api.com/maps/7eae2e51-4ece-f12b-57fc-92b2dd29d3c4/splash.png) center center / cover no-repeat',
        height: '100%',
        width: '100%',
        overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }}></div>

      <div className="ingame-scaler" style={{ zIndex: 10, display: 'flex', flexDirection: 'column', width: '100%', height: '100%', maxWidth: '1400px', padding: '40px 20px', paddingBottom: '120px' }}>
          
          <div style={{ display: 'flex', gap: '30px', flex: 1, alignItems: 'flex-start', justifyContent: 'center', marginTop: '30px' }}>
              
              {/* Left Panel: Player Info */}
              <div style={{ width: '250px', display: 'flex', flexDirection: 'column', gap: '2px', alignSelf: 'flex-start' }}>
                <div style={{ border: '1px solid rgba(255,255,255,0.3)', padding: '15px', background: 'rgba(20,20,20,0.7)', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <img src={myAgentIcon} alt="Agent" style={{ width: '45px', height: '45px', border: '1px solid rgba(255,255,255,0.2)' }} />
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--color-yellow)', fontSize: '14px', textTransform: 'uppercase' }}>shumi747</div>
                        <div style={{ display: 'flex', gap: '5px', marginTop: '4px' }}>
                            <div style={{ width: '16px', height: '16px', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '50%' }}></div>
                            <img src="https://media.valorant-api.com/weapons/29a0cfab-485b-f5d5-779a-b59f85e204a8/displayicon.png" alt="Classic" style={{ width: '20px', height: '10px' }} />
                        </div>
                    </div>
                </div>

                <div style={{ background: 'rgba(20,20,20,0.7)', padding: '10px 15px', display: 'flex', justifyContent: 'flex-end', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <span style={{ fontSize: '22px', fontWeight: 900, fontFamily: "'Orbitron', sans-serif", display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ fontSize: '14px', color: 'var(--color-cyan)' }}>¤</span> {myCredits.toLocaleString()}
                    </span>
                </div>
                
                <div style={{ fontSize: '9px', color: 'var(--text-muted)', textTransform: 'uppercase', margin: '15px 0 5px 0', fontWeight: 700 }}>
                    MÍN. PARA LA PRÓXIMA RONDA: <span style={{ float: 'right' }}>¤ 0</span>
                </div>
              </div>

              {/* Center Grid: Armory */}
              <div style={{ display: 'flex', gap: '10px', flex: 2 }}>
                  {renderWeaponCol([{title: 'ARMAS DE MANO', id: 'EEquippableCategory::Sidearm'}])}
                  {renderWeaponCol([{title: 'SUBFUSILES', id: 'EEquippableCategory::SMG'}, {title: 'ESCOPETAS', id: 'EEquippableCategory::Shotgun'}])}
                  {renderWeaponCol([{title: 'RIFLES', id: 'EEquippableCategory::Rifle'}])}
                  {renderWeaponCol([{title: 'FUSILES DE FRANCOTIRADOR', id: 'EEquippableCategory::Sniper'}, {title: 'AMETRALLADORAS', id: 'EEquippableCategory::Heavy'}])}
                  {renderArmorCol()}
              </div>

              {/* Right Panel: Weapon Stats */}
              <div style={{ width: '280px', display: 'flex', flexDirection: 'column', height: '500px', background: 'rgba(20,20,20,0.75)', padding: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {hoveredWeapon ? (
                      <>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid rgba(255,255,255,0.2)', paddingBottom: '15px' }}>
                              <div style={{ fontWeight: 900, fontSize: '18px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  {hoveredWeapon.displayName.toUpperCase()} <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 400 }}>| {hoveredWeapon.shopData?.categoryText.toUpperCase()}</span>
                              </div>
                              <div style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                                  <span>DISPARO PRINCIPAL</span>
                                  <span>Auto / Baja</span>
                              </div>
                          </div>
                          
                          {hoveredWeapon.weaponStats ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
                                  <div style={{ display: 'flex', gap: '15px' }}>
                                      <div style={{ flex: 1, borderTop: '2px solid var(--color-cyan)', paddingTop: '5px' }}>
                                          <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>VELOCIDAD AL CORRER</div>
                                          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>5.74 <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>M/S</span></div>
                                      </div>
                                      <div style={{ flex: 1, borderTop: '2px solid var(--color-cyan)', paddingTop: '5px' }}>
                                          <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>VELOCIDAD DE EQUIPAMIENTO</div>
                                          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{hoveredWeapon.weaponStats.equipTimeSeconds} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>S</span></div>
                                      </div>
                                  </div>
                                  <div style={{ display: 'flex', gap: '15px' }}>
                                      <div style={{ flex: 1, borderTop: '2px solid var(--color-cyan)', paddingTop: '5px' }}>
                                          <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>VELOCIDAD DE RECARGA</div>
                                          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{hoveredWeapon.weaponStats.reloadTimeSeconds} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>S</span></div>
                                      </div>
                                      <div style={{ flex: 1, borderTop: '2px solid rgba(255,255,255,0.2)', paddingTop: '5px' }}>
                                          <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>CARGADOR</div>
                                          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{hoveredWeapon.weaponStats.magazineSize} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BALAS</span></div>
                                      </div>
                                  </div>
                                  
                                  <div style={{ display: 'flex', gap: '15px' }}>
                                      <div style={{ flex: 1, borderTop: '2px solid var(--color-cyan)', paddingTop: '5px' }}>
                                          <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>VELOCIDAD DE DISPARO</div>
                                          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{hoveredWeapon.weaponStats.fireRate} <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BALAS/S</span></div>
                                      </div>
                                      <div style={{ flex: 1, borderTop: '2px solid rgba(255,255,255,0.2)', paddingTop: '5px' }}>
                                          <div style={{ fontSize: '8px', color: 'var(--text-muted)' }}>DISPERSIÓN (DISPARO 1)</div>
                                          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{hoveredWeapon.weaponStats.firstBulletAccuracy} <span style={{ fontSize: '8px', color: 'var(--text-muted)' }}>MIRA</span></div>
                                      </div>
                                  </div>

                                  <div style={{ marginTop: '10px' }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '5px', marginBottom: '10px' }}>
                                          <div style={{ fontSize: '10px', fontWeight: 900 }}>DAÑO</div>
                                          <div style={{ display: 'flex', gap: '15px', fontSize: '8px', color: 'var(--text-muted)' }}>
                                              {hoveredWeapon.weaponStats.damageRanges.map((dr, idx) => (
                                                  <span key={idx}>{dr.rangeStartMeters}-{dr.rangeEndMeters} m</span>
                                              ))}
                                          </div>
                                      </div>
                                      
                                      <div style={{ display: 'flex', gap: '15px' }}>
                                          <div style={{ width: '40px', height: '60px', border: '1px dashed var(--text-muted)', position: 'relative' }}>
                                              <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '10px', borderRadius: '50%', background: 'white' }}></div>
                                              <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translateX(-50%)', width: '16px', height: '24px', background: 'white' }}></div>
                                              <div style={{ position: 'absolute', top: '70%', left: '50%', transform: 'translateX(-50%)', width: '10px', height: '16px', background: 'white' }}></div>
                                          </div>
                                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px' }}>
                                                  {hoveredWeapon.weaponStats.damageRanges.map((dr, idx) => (
                                                      <span key={idx} style={{ fontSize: '13px', fontWeight: 'bold' }}>{dr.headDamage}</span>
                                                  ))}
                                              </div>
                                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px' }}>
                                                  {hoveredWeapon.weaponStats.damageRanges.map((dr, idx) => (
                                                      <span key={idx} style={{ fontSize: '13px', fontWeight: 'bold' }}>{dr.bodyDamage}</span>
                                                  ))}
                                              </div>
                                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '20px' }}>
                                                  {hoveredWeapon.weaponStats.damageRanges.map((dr, idx) => (
                                                      <span key={idx} style={{ fontSize: '13px', fontWeight: 'bold' }}>{dr.legDamage}</span>
                                                  ))}
                                              </div>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          ) : (
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '20px' }}>Estadísticas no disponibles</div>
                          )}
                      </>
                  ) : (
                      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
                          Pasa el ratón sobre un arma<br/>para ver sus estadísticas
                      </div>
                  )}
              </div>
          </div>
      </div>

      {/* Bottom Panel: Abilities */}
      {basicAbilities.length > 0 && (
          <div className="abilities-scaler" style={{ position: 'absolute', bottom: '40px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '15px', zIndex: 20 }}>
              <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: 900, letterSpacing: '1px' }}>HABILIDADES</div>
              {basicAbilities.map((ab, idx) => (
                  <div key={idx} style={{ width: '240px', height: '80px', background: 'rgba(0, 240, 255, 0.1)', border: '2px solid var(--color-cyan)', display: 'flex', alignItems: 'center', padding: '15px', position: 'relative' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--color-yellow)', marginRight: '15px' }}></div>
                      {ab.displayIcon && (
                          <img src={ab.displayIcon} alt={ab.displayName} style={{ width: '45px', height: '45px', filter: 'drop-shadow(0 0 5px var(--color-cyan))' }} />
                      )}
                      <div style={{ position: 'absolute', bottom: '8px', right: '12px', textAlign: 'right' }}>
                          <div style={{ fontSize: '8px', color: 'var(--color-cyan)', fontWeight: 700, letterSpacing: '1px' }}>LLENA</div>
                          <div style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginTop: '2px' }}>{ab.displayName}</div>
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
}
