import { motion } from "framer-motion";
import { Zap, Shield, Layout, Share2, Code2 } from "lucide-react";

export const BentoGrid = () => {
  return (
    <section id="features" className="container" style={{ padding: "100px 20px" }}>
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, marginBottom: "16px" }}>
          Everything you need to <span className="text-gradient">master your data</span>
        </h2>
        <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem", maxWidth: "600px", margin: "0 auto" }}>
          Built for modern engineering teams. Fast, private, and beautiful.
        </p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(12, 1fr)",
        gridAutoRows: "minmax(200px, auto)",
        gap: "20px",
        maxWidth: "1200px",
        margin: "0 auto"
      }}>
        {/* Large Item: Interactive Visualization */}
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{
                gridColumn: "span 12", // Mobile: span 12
                background: "linear-gradient(135deg, rgba(20,20,20,0.8), rgba(10,10,10,0.9))",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "24px",
                padding: "40px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                justifyContent: "flex-end",
                position: "relative",
                overflow: "hidden",
                minHeight: "400px"
            }}
            // Responsive grid adjustments via media query would be ideal, but inline styles are requested/common here. 
            // We'll rely on the grid breakdown for larger screens.
            // On desktop this stays full width or 8 cols? Let's do 8 cols on desktop.
            className="bento-large"
        >
            <div style={{ position: "relative", zIndex: 2, maxWidth: "500px" }}>
                <div className="icon-box" style={{ marginBottom: "20px", background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6" }}>
                    <Layout size={24} />
                </div>
                <h3 style={{ fontSize: "2rem", marginBottom: "12px" }}>Visual Schema Design</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>
                    Drag, drop, and connect tables to visualize your database relationships. 
                    Changes reflect in real-time with intuitive controls.
                </p>
            </div>
            
            {/* Decorative Background */}
            <div style={{
                position: "absolute",
                top: "50%",
                right: "-10%",
                width: "600px",
                height: "600px",
                background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
                filter: "blur(60px)",
                zIndex: 1
            }} />
        </motion.div>

        {/* Medium: Local First */}
        <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.1 }}
             style={{
                 gridColumn: "span 4",
                 background: "rgba(20,20,20,0.6)",
                 border: "1px solid rgba(255,255,255,0.08)",
                 borderRadius: "24px",
                 padding: "30px",
                 display: "flex",
                 flexDirection: "column",
                 justifyContent: "space-between",
                 backdropFilter: "blur(12px)"
             }}
             className="bento-medium"
        >
             <div className="icon-box" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", marginBottom: "20px" }}>
                <Shield size={24} />
            </div>
            <div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Local & Private</h3>
                <p style={{ color: "var(--text-secondary)" }}>
                    Your data never leaves your device. We connect directly to your Postgres instance.
                </p>
            </div>
        </motion.div>

        {/* Medium: Performance */}
        <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.2 }}
             style={{
                 gridColumn: "span 4",
                 background: "rgba(20,20,20,0.6)",
                 border: "1px solid rgba(255,255,255,0.08)",
                 borderRadius: "24px",
                 padding: "30px",
                 backdropFilter: "blur(12px)"
             }}
             className="bento-medium"
        >
             <div className="icon-box" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", marginBottom: "20px" }}>
                <Zap size={24} />
            </div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Blazing Fast</h3>
            <p style={{ color: "var(--text-secondary)" }}>
                Built with Rust and Tauri for native performance and minimal memory footprint.
            </p>
        </motion.div>

        {/* Small: SQL Export */}
        <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.3 }}
             style={{
                 gridColumn: "span 4",
                 background: "rgba(20,20,20,0.6)",
                 border: "1px solid rgba(255,255,255,0.08)",
                 borderRadius: "24px",
                 padding: "30px",
                 backdropFilter: "blur(12px)"
             }}
             className="bento-medium"
        >
            <div className="icon-box" style={{ background: "rgba(236, 72, 153, 0.1)", color: "#ec4899", marginBottom: "20px" }}>
                <Code2 size={24} />
            </div>
            <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>SQL Export</h3>
            <p style={{ color: "var(--text-secondary)" }}>
                Generate production-ready SQL migrations from your visual designs.
            </p>
        </motion.div>

         {/* Wide: Collaboration (Future) */}
         <motion.div
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ delay: 0.4 }}
             style={{
                 gridColumn: "span 8",
                 background: "linear-gradient(to right, rgba(20,20,20,0.8), rgba(30,30,30,0.8))",
                 border: "1px solid rgba(255,255,255,0.08)",
                 borderRadius: "24px",
                 padding: "30px",
                 display: "flex",
                 alignItems: "center",
                 gap: "20px",
                 overflow: "hidden",
                 position: "relative"
             }}
             className="bento-wide"
        >
            <div style={{ position: "relative", zIndex: 1 }}>
                <div className="icon-box" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", marginBottom: "20px" }}>
                    <Share2 size={24} />
                </div>
                <h3 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>Export & Share</h3>
                <p style={{ color: "var(--text-secondary)", maxWidth: "400px" }}>
                    Export your schemas as high-quality images or PDF documentation to share with your team.
                </p>
            </div>
            
            {/* Visual Abstract */}
            <div style={{
                position: "absolute",
                right: "-50px",
                top: "50%",
                transform: "translateY(-50%)",
                width: "300px",
                height: "200px",
                background: "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 10px, transparent 10px, transparent 20px)",
                opacity: 0.5
            }} />
        </motion.div>
      </div>

       <style>{`
        .icon-box {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        @media (max-width: 1024px) {
           .bento-large { grid-column: span 12 !important; }
           .bento-medium { grid-column: span 6 !important; }
           .bento-wide { grid-column: span 12 !important; }
        }

        @media (max-width: 768px) {
           .bento-medium { grid-column: span 12 !important; }
        }
      `}</style>
    </section>
  );
};
