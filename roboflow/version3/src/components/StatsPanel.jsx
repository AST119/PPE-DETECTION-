export default function StatsPanel({ counts }) {
  const items = [
    { label: 'Persons', val: counts.person, color: 'text-white' },
    { label: 'Hard Hat', val: counts.helmet, color: 'text-yellow-400' },
    { label: 'Vest', val: counts.vest, color: 'text-orange-500' },
    { label: 'Gloves', val: counts.gloves, color: 'text-cyan-400' },
  ];

  return (
    <div className="bg-[#0d1117] rounded-2xl border border-blue-900/20 p-6 grid grid-cols-2 gap-4">
      {items.map(i => (
        <div key={i.label} className="stat-card">
          <span className={`text-4xl font-black ${i.color}`}>{i.val}</span>
          <label className="text-[10px] font-black uppercase text-slate-500 mt-2 tracking-widest">{i.label}</label>
        </div>
      ))}
    </div>
  );
}
