import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

type ScheduleItem = {
  id: string;
  date: string;
  time: string;
  address: string;
  contractorName: string;
  note: string;
};

const TimePicker = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [h24, m24] = value.split(':').map(Number);
  const initialIsPM = h24 >= 12;
  const initialH12 = h24 % 12 || 12;
  const initialM = m24.toString().padStart(2, '0');

  const [h12, setH12] = useState(initialH12);
  const [m, setM] = useState(initialM);
  const [isPM, setIsPM] = useState(initialIsPM);

  useEffect(() => {
    let finalH24 = h12;
    if (isPM && h12 < 12) finalH24 += 12;
    if (!isPM && h12 === 12) finalH24 = 0;
    
    const hStr = finalH24.toString().padStart(2, '0');
    onChange(`${hStr}:${m}`);
  }, [h12, m, isPM]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = ['00', '15', '30', '45'];

  return (
    <div className="flex flex-col gap-1 w-full md:w-auto">
      <label className="text-[10px] font-bold opacity-50">TIME</label>
      <div className="flex gap-2">
        <select 
          value={`${h12}:${m}`}
          onChange={(e) => {
            const [newH, newM] = e.target.value.split(':');
            setH12(Number(newH));
            setM(newM);
          }}
          className="text-lg font-black bg-black border border-white rounded-lg p-2 appearance-auto"
        >
          {hours.flatMap(h => minutes.map(min => (
            <option key={`${h}:${min}`} value={`${h}:${min}`}>
              {h}:{min}
            </option>
          )))}
        </select>
        <button
          type="button"
          onClick={() => setIsPM(!isPM)}
          className={`px-4 py-2 border border-white rounded-lg font-black transition-colors ${isPM ? 'bg-white text-black' : 'bg-black text-white'}`}
        >
          {isPM ? 'PM' : 'AM'}
        </button>
      </div>
    </div>
  );
};

export default function App() {
  const [items, setItems] = useState<ScheduleItem[]>(() => {
    const saved = localStorage.getItem('fucking_scheduler_items');
    return saved ? JSON.parse(saved) : [];
  });

  const [savedAddresses, setSavedAddresses] = useState<string[]>(() => {
    const saved = localStorage.getItem('fucking_scheduler_addresses');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('fucking_scheduler_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('fucking_scheduler_addresses', JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('08:15');
  const [address, setAddress] = useState('');
  const [contractorName, setContractorName] = useState('');
  const [note, setNote] = useState('');

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !time || !address || !contractorName) return;

    const upperAddress = address.toUpperCase();
    const newItem: ScheduleItem = {
      id: crypto.randomUUID(),
      date,
      time,
      address: upperAddress,
      contractorName: contractorName.toUpperCase(),
      note: note.toUpperCase(),
    };

    setItems([...items, newItem]);
    
    // Save address if new
    if (!savedAddresses.includes(upperAddress)) {
      setSavedAddresses([...savedAddresses, upperAddress]);
    }
    
    setAddress('');
    setContractorName('');
    setNote('');
  };

  const deleteItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const sortedItems = [...items].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateA.getTime() - dateB.getTime();
  });

  // Group by date for the planner view
  const groupedItems = sortedItems.reduce((groups: Record<string, ScheduleItem[]>, item) => {
    const date = item.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(item);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedItems).sort();

  return (
    <div className="min-h-screen p-4 md:p-8 font-mono uppercase tracking-tight selection:bg-white selection:text-black max-w-4xl mx-auto flex flex-col">
      <header className="mb-16 pt-12 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tighter">
          Fucking <span className="text-white/90">Schedule</span>
        </h1>
      </header>

      <main className="space-y-12 flex-grow">
        {/* INPUT SECTION */}
        <section className="border-2 border-white p-6 rounded-3xl">
          <form onSubmit={addItem} className="space-y-6">
            <div className="flex flex-row flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs font-bold mb-2 opacity-50">DATE</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)}
                  required
                  className="text-lg"
                />
              </div>
              <TimePicker value={time} onChange={setTime} />
            </div>
            <div className="space-y-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="ADDRESS" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)}
                  list="saved-addresses"
                  required
                  className="text-lg"
                />
                <datalist id="saved-addresses">
                  {savedAddresses.map(addr => (
                    <option key={addr} value={addr} />
                  ))}
                </datalist>
              </div>
              <input 
                type="text" 
                placeholder="CONTRACTOR NAME" 
                value={contractorName} 
                onChange={e => setContractorName(e.target.value)}
                required
                className="text-lg"
              />
              <textarea 
                placeholder="NOTE" 
                value={note} 
                onChange={e => setNote(e.target.value)}
                className="text-lg min-h-[100px]"
              />
            </div>
            <button type="submit" className="w-full text-xl py-6 font-black border-2 border-white hover:bg-white hover:text-black transition-colors rounded-full">
              ADD TO PLANNER
            </button>
          </form>
        </section>

        {/* PLANNER SECTION */}
        <section className="space-y-8">
          {sortedDates.length === 0 ? (
            <div className="border-2 border-dashed border-white/20 p-12 text-center">
              <span className="text-lg font-bold opacity-50">PLANNER IS EMPTY</span>
            </div>
          ) : (
            sortedDates.map(dateStr => (
              <div key={dateStr} className="space-y-4">
                <h2 className="text-2xl font-black bg-white text-black px-2 py-1 inline-block">
                  {new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }).toUpperCase()}
                </h2>
                <div className="space-y-4">
                  {groupedItems[dateStr].map(item => (
                    <div key={item.id} className="border border-white p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-6 group hover:bg-white hover:text-black transition-colors">
                      <div className="flex-1 space-y-2">
                        <div className="text-2xl font-black">{item.time}</div>
                        <div className="text-xl font-bold leading-tight">{item.address}</div>
                        <div className="flex flex-col pt-2 border-t border-white/20 group-hover:border-black/20 space-y-1">
                          <span className="text-lg font-bold opacity-80 group-hover:opacity-100">{item.contractorName}</span>
                          {item.note && <p className="text-base opacity-60 group-hover:opacity-100 italic">{item.note}</p>}
                        </div>
                      </div>
                      <button 
                        onClick={() => deleteItem(item.id)}
                        className="p-3 border border-white group-hover:border-black hover:!bg-red-600 hover:!text-white hover:!border-red-600 self-end md:self-center rounded-full transition-colors"
                        aria-label="Delete item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      <footer className="mt-20 pb-8 text-center opacity-30 hover:opacity-100 transition-opacity">
        <span className="text-[10px] tracking-[0.3em]">@LAMPACTSTUDIOS</span>
      </footer>
    </div>
  );
}
