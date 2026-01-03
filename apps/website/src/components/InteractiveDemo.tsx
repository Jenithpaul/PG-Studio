import { motion } from 'framer-motion';
import { Database, Key, GripVertical } from 'lucide-react';
import { useState } from 'react';

// Define types for better safety
interface Column {
  name: string;
  type: string;
  pk?: boolean;
  fk?: boolean;
  unique?: boolean;
}

interface TableData {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  width: number;
  height: number;
  columns: Column[];
}

const initialTables: TableData[] = [
  {
    id: 'users',
    name: 'users',
    color: '#3b82f6',
    x: 50,
    y: 100,
    width: 240,
    height: 180,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'email', type: 'varchar', unique: true },
      { name: 'full_name', type: 'varchar' },
      { name: 'created_at', type: 'timestamp' }
    ]
  },
  {
    id: 'posts',
    name: 'posts',
    color: '#10b981',
    x: 350,
    y: 50,
    width: 240,
    height: 200,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'user_id', type: 'uuid', fk: true },
      { name: 'title', type: 'varchar' },
      { name: 'content', type: 'text' },
      { name: 'published', type: 'boolean' }
    ]
  },
  {
    id: 'comments',
    name: 'comments',
    color: '#f59e0b',
    x: 680,
    y: 150,
    width: 240,
    height: 160,
    columns: [
      { name: 'id', type: 'uuid', pk: true },
      { name: 'post_id', type: 'uuid', fk: true },
      { name: 'user_id', type: 'uuid', fk: true },
      { name: 'body', type: 'text' }
    ]
  }
];

// Component for a single draggable table
const DraggableTable = ({ 
  data, 
  onDrag 
}: { 
  data: TableData, 
  onDrag: (id: string, x: number, y: number) => void 
}) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      onDrag={(_, info) => {
        // We update parent state on drag to redraw lines
        // offset needs to be added to initial position
        onDrag(data.id, data.x + info.offset.x, data.y + info.offset.y);
      }}
      initial={{ x: data.x, y: data.y, opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="interactive-table" // We'll add some glassmorphism classes in global css or inline
      style={{
        position: 'absolute',
        top: 0, 
        left: 0,
        width: data.width,
        background: 'rgba(20, 20, 20, 0.9)',
        backdropFilter: 'blur(12px)',
        borderRadius: '16px',
        border: `1px solid ${data.color}40`,
        boxShadow: `0 20px 40px -10px rgba(0,0,0,0.6), 0 0 0 1px ${data.color}20`,
        overflow: 'hidden',
        zIndex: 10
      }}
    >
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        background: `linear-gradient(90deg, ${data.color}20 0%, transparent 100%)`,
        borderBottom: `1px solid ${data.color}20`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'grab'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={14} color={data.color} />
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#fff' }}>{data.name}</span>
        </div>
        <GripVertical size={14} color="rgba(255,255,255,0.2)" />
      </div>

      {/* Columns */}
      <div style={{ padding: '8px 4px' }}>
        {data.columns.map((col, idx) => (
          <div key={idx} style={{
            padding: '6px 12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '13px',
            borderRadius: '6px',
            transition: 'background 0.2s',
           marginBottom: '2px'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
               {col.pk && <Key size={12} color="#fbbf24" />}
               {col.fk && <Key size={12} color="#9ca3af" style={{ transform: 'rotate(180deg)' }} />}
               <span style={{ color: col.pk || col.fk ? '#fff' : '#a1a1aa' }}>{col.name}</span>
            </div>
            <span style={{ color: '#555', fontSize: '11px', fontFamily: 'monospace' }}>{col.type}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export const InteractiveDemo = () => {
    const [tablePositions, setTablePositions] = useState<{ [key: string]: { x: number, y: number } }>(() => {
        const pos: any = {};
        initialTables.forEach(t => pos[t.id] = { x: t.x, y: t.y });
        return pos;
    });

    const handleDrag = (id: string, x: number, y: number) => {
        setTablePositions(prev => ({
            ...prev,
            [id]: { x, y }
        }));
    };

    // Calculate bezier curves between tables
    const getConnectionPath = (t1Id: string, t2Id: string) => {
        const t1 = initialTables.find(t => t.id === t1Id)!;
        const t2 = initialTables.find(t => t.id === t2Id)!;
        
        // Dynamic current positions (offset by half width/height for center-ish connection, or side connection)
        const p1 = tablePositions[t1Id] || {x: t1.x, y: t1.y};
        const p2 = tablePositions[t2Id] || {x: t2.x, y: t2.y};

        // Right side of T1 to Left side of T2
        const start = { x: p1.x + t1.width, y: p1.y + 60 }; // Approx row height for 'id'
        const end = { x: p2.x, y: p2.y + 60 }; 

        // Bezier Control Points
        const cp1 = { x: start.x + 80, y: start.y };
        const cp2 = { x: end.x - 80, y: end.y };

        return `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;
    };

    return (
        <div style={{
            width: '100%',
            height: '500px',
            position: 'relative',
            background: 'radial-gradient(circle at 50% 50%, #1a1a1a 0%, #050505 100%)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 50px 100px -20px rgba(0,0,0,0.5)',
            overflow: 'hidden'
        }}>
            {/* Animated Grid */}
            <div className="bg-grid" style={{ opacity: 0.15 }}></div>
            
            {/* SVG Layer for Connections */}
            <svg style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 1,
                filter: 'drop-shadow(0 0 4px rgba(16, 185, 129, 0.4))'
            }}>
                <defs>
                   <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                </defs>
                
                {/* Users -> Posts */}
                <motion.path 
                    d={getConnectionPath('users', 'posts')}
                    stroke="url(#line-gradient)"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                 {/* Posts -> Comments */}
                 <motion.path 
                    d={getConnectionPath('posts', 'comments')}
                    stroke="#10b981" // simpler color for second connection
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="4 4"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                />
            </svg>

            {/* Tables */}
            {initialTables.map(table => (
                <DraggableTable 
                    key={table.id} 
                    data={table} 
                    onDrag={handleDrag} 
                />
            ))}

            {/* Floating "Live" Label */}
            <div style={{
                position: 'absolute',
                bottom: '24px',
                right: '24px',
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(10px)',
                borderRadius: '100px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                zIndex: 20
            }}>
                <div style={{
                    width: '8px',
                    height: '8px', 
                    borderRadius: '50%', 
                    background: '#10b981',
                    boxShadow: '0 0 10px #10b981' 
                }} />
                <span style={{ fontSize: '13px', color: '#a1a1aa', fontFamily: 'var(--font-main)' }}>
                    Interactive Demo
                </span>
            </div>
        </div>
    );
};
