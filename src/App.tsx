import React, { useState, useEffect } from 'react';
import { 
  Cake, 
  Plus, 
  Trash2, 
  Search, 
  Calendar, 
  Gift, 
  PawPrint, 
  User, 
  Phone,
  Sparkles,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, isSameMonth, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { GoogleGenAI } from "@google/genai";

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  birthday: string;
  owner_name: string;
  owner_contact: string;
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function App() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPet, setNewPet] = useState({
    name: '',
    species: 'Cachorro',
    breed: '',
    birthday: '',
    owner_name: '',
    owner_contact: ''
  });
  const [mimoIdeas, setMimoIdeas] = useState<Record<number, string>>({});
  const [generatingMimo, setGeneratingMimo] = useState<Record<number, boolean>>({});

  const currentMonth = format(new Date(), 'MM');
  const monthName = format(new Date(), 'MMMM', { locale: ptBR });

  useEffect(() => {
    fetchPets();
  }, []);

  const fetchPets = async () => {
    try {
      const response = await fetch('/api/pets');
      const data = await response.json();
      setPets(data);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/pets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPet),
      });
      if (response.ok) {
        fetchPets();
        setShowAddForm(false);
        setNewPet({
          name: '',
          species: 'Cachorro',
          breed: '',
          birthday: '',
          owner_name: '',
          owner_contact: ''
        });
      }
    } catch (error) {
      console.error('Error adding pet:', error);
    }
  };

  const handleDeletePet = async (id: number) => {
    if (!confirm('Tem certeza que deseja remover este pet?')) return;
    try {
      await fetch(`/api/pets/${id}`, { method: 'DELETE' });
      fetchPets();
    } catch (error) {
      console.error('Error deleting pet:', error);
    }
  };

  const generateMimoIdea = async (pet: Pet) => {
    setGeneratingMimo(prev => ({ ...prev, [pet.id]: true }));
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Sugira 3 ideias criativas e baratas de "mimos" ou presentes de aniversário para um pet com as seguintes características:
        Nome: ${pet.name}
        Espécie: ${pet.species}
        Raça: ${pet.breed || 'Não informada'}
        
        Responda em português, de forma amigável e concisa, formatado em tópicos.`,
      });
      setMimoIdeas(prev => ({ ...prev, [pet.id]: response.text || 'Não foi possível gerar ideias no momento.' }));
    } catch (error) {
      console.error('Error generating mimo ideas:', error);
      setMimoIdeas(prev => ({ ...prev, [pet.id]: 'Erro ao conectar com a IA.' }));
    } finally {
      setGeneratingMimo(prev => ({ ...prev, [pet.id]: false }));
    }
  };

  const birthdayPets = pets.filter(pet => {
    const petMonth = pet.birthday.split('-')[1];
    return petMonth === currentMonth;
  });

  return (
    <div className="min-h-screen bg-[#fdfcfb] text-[#4a4a40] font-serif">
      {/* Header */}
      <header className="bg-white border-b border-[#5a5a40]/10 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#5a5a40] rounded-full flex items-center justify-center text-white shadow-lg">
              <PawPrint size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#1a1a1a]">Pet B-Day Mural</h1>
              <p className="text-sm text-[#5a5a40]/60 italic">Celebrando nossos amigos peludos</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="olive-button flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
          >
            <Plus size={18} />
            <span>Novo Pet</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-16">
        
        {/* Birthday Section */}
        <section className="space-y-8">
          <div className="flex items-baseline gap-4 border-b border-[#5a5a40]/20 pb-4">
            <h2 className="text-4xl font-black text-[#1a1a1a] capitalize">
              {monthName}
            </h2>
            <span className="text-xl italic text-[#5a5a40]/60">Aniversariantes do Mês</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-[#5a5a40]" size={40} />
            </div>
          ) : birthdayPets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {birthdayPets.map((pet) => (
                <motion.div 
                  layoutId={`pet-${pet.id}`}
                  key={pet.id}
                  className="card group overflow-hidden relative"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleDeletePet(pet.id)}
                      className="text-red-400 hover:text-red-600 p-2"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-[#f5f5f0] rounded-full flex items-center justify-center text-[#5a5a40] border-2 border-[#5a5a40]/10">
                        <Cake size={32} />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-[#1a1a1a]">{pet.name}</h3>
                        <p className="text-sm italic text-[#5a5a40]/70">{pet.species} • {pet.breed || 'SRD'}</p>
                      </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[#f5f5f0]">
                      <div className="flex items-center gap-3 text-sm">
                        <Calendar size={16} className="text-[#5a5a40]/40" />
                        <span>Dia {pet.birthday.split('-')[2]} de {monthName}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <User size={16} className="text-[#5a5a40]/40" />
                        <span>Tutor: {pet.owner_name}</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <Phone size={16} className="text-[#5a5a40]/40" />
                        <span>{pet.owner_contact}</span>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button 
                        onClick={() => generateMimoIdea(pet)}
                        disabled={generatingMimo[pet.id]}
                        className="w-full py-3 px-4 rounded-xl border border-[#5a5a40]/20 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#5a5a40] hover:text-white transition-colors disabled:opacity-50"
                      >
                        {generatingMimo[pet.id] ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                        <span>Ideias de Mimos (IA)</span>
                      </button>
                    </div>

                    <AnimatePresence>
                      {mimoIdeas[pet.id] && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 p-4 bg-[#f5f5f0] rounded-xl text-xs leading-relaxed italic text-[#5a5a40]"
                        >
                          <div className="flex items-center gap-2 mb-2 font-bold not-italic uppercase tracking-wider text-[10px]">
                            <Gift size={12} />
                            Sugestões da IA
                          </div>
                          {mimoIdeas[pet.id].split('\n').map((line, i) => (
                            <p key={i}>{line}</p>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-[32px] border border-dashed border-[#5a5a40]/20">
              <div className="max-w-xs mx-auto space-y-4">
                <div className="w-16 h-16 bg-[#f5f5f0] rounded-full flex items-center justify-center text-[#5a5a40]/30 mx-auto">
                  <Calendar size={32} />
                </div>
                <p className="text-lg italic text-[#5a5a40]/60">Nenhum aniversariante encontrado para este mês.</p>
              </div>
            </div>
          )}
        </section>

        {/* All Pets Section */}
        <section className="space-y-8">
          <div className="flex justify-between items-center border-b border-[#5a5a40]/20 pb-4">
            <h2 className="text-2xl font-bold text-[#1a1a1a]">Todos os Pets</h2>
            <div className="text-sm text-[#5a5a40]/60">{pets.length} cadastrados</div>
          </div>

          <div className="bg-white rounded-[32px] shadow-sm border border-[#5a5a40]/5 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f5f5f0]/50 text-[11px] uppercase tracking-widest text-[#5a5a40]/60 font-bold">
                  <th className="px-8 py-4">Pet</th>
                  <th className="px-8 py-4">Espécie/Raça</th>
                  <th className="px-8 py-4">Aniversário</th>
                  <th className="px-8 py-4">Tutor</th>
                  <th className="px-8 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f5f5f0]">
                {pets.map((pet) => (
                  <tr key={pet.id} className="group hover:bg-[#fdfcfb] transition-colors">
                    <td className="px-8 py-6">
                      <div className="font-bold text-[#1a1a1a]">{pet.name}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm">{pet.species}</div>
                      <div className="text-xs italic text-[#5a5a40]/60">{pet.breed || 'SRD'}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm">{format(parseISO(pet.birthday), "dd 'de' MMMM", { locale: ptBR })}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-sm">{pet.owner_name}</div>
                      <div className="text-xs text-[#5a5a40]/60">{pet.owner_contact}</div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDeletePet(pet.id)}
                        className="text-[#5a5a40]/20 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                {pets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center italic text-[#5a5a40]/40">
                      Nenhum pet cadastrado ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Add Form Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddForm(false)}
              className="absolute inset-0 bg-[#1a1a1a]/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-[#1a1a1a]">Cadastrar Novo Pet</h3>
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="text-[#5a5a40]/40 hover:text-[#1a1a1a]"
                  >
                    <Plus className="rotate-45" size={24} />
                  </button>
                </div>

                <form onSubmit={handleAddPet} className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-widest font-bold text-[#5a5a40]/60">Nome do Pet</label>
                      <input 
                        required
                        type="text"
                        value={newPet.name}
                        onChange={e => setNewPet({...newPet, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] border-none focus:ring-2 focus:ring-[#5a5a40]/20 outline-none"
                        placeholder="Ex: Bob"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-widest font-bold text-[#5a5a40]/60">Espécie</label>
                      <select 
                        value={newPet.species}
                        onChange={e => setNewPet({...newPet, species: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] border-none focus:ring-2 focus:ring-[#5a5a40]/20 outline-none appearance-none"
                      >
                        <option>Cachorro</option>
                        <option>Gato</option>
                        <option>Pássaro</option>
                        <option>Coelho</option>
                        <option>Outro</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-widest font-bold text-[#5a5a40]/60">Raça</label>
                      <input 
                        type="text"
                        value={newPet.breed}
                        onChange={e => setNewPet({...newPet, breed: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] border-none focus:ring-2 focus:ring-[#5a5a40]/20 outline-none"
                        placeholder="Ex: Golden Retriever"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[11px] uppercase tracking-widest font-bold text-[#5a5a40]/60">Data de Nascimento</label>
                      <input 
                        required
                        type="date"
                        value={newPet.birthday}
                        onChange={e => setNewPet({...newPet, birthday: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] border-none focus:ring-2 focus:ring-[#5a5a40]/20 outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-[#5a5a40]/60">Nome do Tutor</label>
                    <input 
                      required
                      type="text"
                      value={newPet.owner_name}
                      onChange={e => setNewPet({...newPet, owner_name: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] border-none focus:ring-2 focus:ring-[#5a5a40]/20 outline-none"
                      placeholder="Ex: Maria Silva"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] uppercase tracking-widest font-bold text-[#5a5a40]/60">Contato (WhatsApp/Tel)</label>
                    <input 
                      required
                      type="text"
                      value={newPet.owner_contact}
                      onChange={e => setNewPet({...newPet, owner_contact: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-[#f5f5f0] border-none focus:ring-2 focus:ring-[#5a5a40]/20 outline-none"
                      placeholder="Ex: (11) 99999-9999"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-4 bg-[#5a5a40] text-white rounded-xl font-bold shadow-lg hover:bg-[#4a4a30] transition-colors"
                  >
                    Salvar Pet
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .olive-button {
          background-color: #5A5A40;
          color: white;
          border-radius: 9999px;
          padding: 12px 24px;
          letter-spacing: 0.5px;
          font-weight: 600;
          font-size: 14px;
        }
        .card {
          background-color: #FFFFFF;
          border-radius: 32px;
          box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.05);
          border: 1px solid rgba(90, 90, 64, 0.05);
        }
      `}</style>
    </div>
  );
}
