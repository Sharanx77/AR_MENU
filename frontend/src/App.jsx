import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Mic, X, Plus, Minus, Info, ChevronLeft, Sun, Moon, Zap, CheckCircle2, Search, ArrowRight } from 'lucide-react';

export default function App() {
  // --- NEW: App starts on 'landing' instead of 'menu' ---
  const [view, setView] = useState('landing');
  const [menuItems, setMenuItems] = useState([]); 
  const [cart, setCart] = useState([]);
  const [activeItem, setActiveItem] = useState(null);
  const [theme, setTheme] = useState('dark');
  
  // --- NEW: Search State ---
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [aiData, setAiData] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('Tap to customize...');
  const [isXrayOn, setIsXrayOn] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  
  const iframeRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/menu')
      .then(res => res.json())
      .then(data => setMenuItems(data))
      .catch(err => console.error("Failed to load menu", err));
  }, []);

  const playSound = (type) => {
    try { const audio = new Audio(`/${type}.mp3`); audio.volume = 0.4; audio.play().catch(() => {}); } catch(e){}
  };

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 3000);
  };

  useEffect(() => { document.documentElement.classList.toggle('dark', theme === 'dark'); }, [theme]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.onresult = (e) => setTranscript(e.results[0][0].transcript);
      recognitionRef.current.onend = () => setIsRecording(false);
    }
  }, []);

  const toggleMic = () => {
    playSound('tap');
    if (isRecording) recognitionRef.current.stop();
    else { setIsRecording(true); recognitionRef.current.start(); }
  };

  const addToCart = async () => {
    setIsAiLoading(true);
    let finalNotes = '';
    
    if (transcript !== 'Tap to customize...' && transcript !== '') {
      setTranscript('🤖 AI is parsing your request...');
      try {
        const response = await fetch('http://localhost:5000/api/customize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript })
        });
        const data = await response.json();
        finalNotes = data.notes;
      } catch (err) {
        finalNotes = transcript.replace(/please|i want|give me/gi, "").trim();
      }
    }
    
    const newItem = { ...activeItem, cartId: Date.now(), qty: 1, notes: finalNotes };
    setCart(prev => [...prev, newItem]);
    setIsAiLoading(false);
    setView('menu');
    setTranscript('Tap to customize...');
    playSound('pop');
    showToast(`${activeItem.name} added to bag!`, 'success');
  };

  const updateQty = (id, delta) => { playSound('tap'); setCart(prev => prev.map(i => i.cartId === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)); };
  const removeItem = (id) => { playSound('tap'); setCart(prev => prev.filter(i => i.cartId !== id)); };
  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const handleCheckout = async () => {
    playSound('success');
    try {
      await fetch('http://localhost:5000/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart, total: cartTotal })
      });
      showToast("Order Confirmed! Sending to kitchen.", "success");
    } catch (err) {
      showToast("Offline mode: Order saved locally.", "error");
    }
    setCart([]);
    setView('menu');
  };

  const toggleXray = async () => {
    playSound('scan'); 
    const nextState = !isXrayOn;
    setIsXrayOn(nextState);
    
    if (nextState && activeItem) {
      setAiData({ loading: true });
      iframeRef.current?.contentWindow.postMessage({ action: 'TOGGLE_XRAY', isVisible: true }, '*');
      
      try {
        const response = await fetch(`http://localhost:5000/api/analyze/${activeItem.id}`, { method: 'POST' });
        const data = await response.json();
        setAiData(data); 
      } catch (err) {
        setAiData({ cal: "N/A", pro: "N/A", fact: "Backend connection failed." });
      }
    } else {
      setAiData(null);
      iframeRef.current?.contentWindow.postMessage({ action: 'TOGGLE_XRAY', isVisible: false }, '*');
    }
  };

  const openAR = (item) => {
    playSound('pop');
    setActiveItem(item);
    setView('ar');
    setIsXrayOn(false);
    setTimeout(() => { iframeRef.current?.contentWindow.postMessage({ action: 'LOAD_MODEL', url: item.modelUrl }, '*'); }, 800);
  };

  // --- NEW: Dual Filtering Logic (Diet + Search Bar) ---
  const filteredMenu = menuItems.filter(item => {
    const matchesDiet = activeFilter === "All" || item.diet === activeFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.ingredients && item.ingredients.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDiet && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#050505] text-gray-900 dark:text-white font-['Outfit'] transition-colors duration-500 overflow-x-hidden">
      
      {/* NAVBAR: Hidden on Landing Page */}
      {view !== 'landing' && (
        <nav className="fixed top-0 w-full p-8 flex justify-between items-center z-[100] backdrop-blur-xl bg-white/70 dark:bg-black/10 border-b border-gray-200 dark:border-white/5">
          <motion.h1 onClick={() => { playSound('tap'); setView('landing'); }} className="text-2xl font-black tracking-widest font-['Playfair_Display'] italic cursor-pointer">THE OG CAFE!<span className="text-cyan-500">.</span></motion.h1>
          <div className="flex gap-4 items-center">
            <button onClick={() => { playSound('tap'); setTheme(theme === 'dark' ? 'light' : 'dark'); }} className="p-3 bg-gray-200 dark:bg-white/5 rounded-full hover:scale-105 transition-transform">{theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={() => { playSound('tap'); setView('cart'); }} className="relative p-3 bg-gray-200 dark:bg-white/5 rounded-full hover:scale-105 transition-transform">
              <ShoppingBag size={20} />
              {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-cyan-500 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-black border-2 border-white dark:border-[#050505] text-white">{cart.length}</span>}
            </button>
          </div>
        </nav>
      )}

      <AnimatePresence>
        {toast.visible && (
          <motion.div initial={{ opacity: 0, y: -40, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }} className="fixed top-28 left-1/2 -translate-x-1/2 z-[1000] px-6 py-3 rounded-full font-bold text-sm shadow-2xl flex items-center gap-3 backdrop-blur-xl bg-gray-900/90 dark:bg-white/90 text-white dark:text-black border border-white/10">
            {toast.type === 'success' ? <CheckCircle2 size={18} className="text-cyan-400 dark:text-cyan-600" /> : <Zap size={18} />} {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        
        {/* --- NEW: LANDING PAGE VIEW --- */}
        {view === 'landing' && (
          <motion.main 
            key="landing"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0, scale: 1.05, filter: "blur(10px)" }} 
            transition={{ duration: 0.8 }}
            className="h-screen flex flex-col items-center justify-center relative overflow-hidden px-8"
          >
            {/* Animated Background Elements */}
            <motion.div 
              animate={{ rotate: 360, scale: [1, 1.1, 1] }} 
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute w-[800px] h-[800px] bg-cyan-500/10 dark:bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" 
            />
            
            <div className="z-10 text-center flex flex-col items-center">
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, duration: 0.8, type: "spring" }}>
                <p className="text-cyan-600 dark:text-cyan-400 font-bold tracking-[0.4em] uppercase text-xs mb-6">Welcome to the future of dining</p>
              </motion.div>

              <motion.h1 
                initial={{ y: 50, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
                className="text-7xl md:text-9xl font-black font-['Playfair_Display'] italic tracking-tighter mb-8"
              >
                THE OG CAFE!<span className="text-cyan-500">.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                transition={{ delay: 0.8, duration: 1 }}
                className="max-w-md text-gray-500 dark:text-white/50 text-lg mb-12 font-light leading-relaxed"
              >
                Immerse yourself in our curated artisan menu featuring AI-powered nutritional insights and 3D Augmented Reality previews.
              </motion.p>

              <motion.button 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ delay: 1, duration: 0.5, type: "spring" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { playSound('success'); setView('menu'); }}
                className="group relative flex items-center gap-4 bg-gray-900 dark:bg-white text-white dark:text-black px-10 py-5 rounded-[3rem] font-black uppercase tracking-widest text-xs shadow-2xl overflow-hidden"
              >
                <span className="relative z-10">Enter Experience</span>
                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                <div className="absolute inset-0 bg-cyan-500 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-500 ease-out z-0" />
              </motion.button>
            </div>
          </motion.main>
        )}

        {/* --- MENU VIEW WITH SEARCH BAR --- */}
        {view === 'menu' && (
          <motion.main key="menu" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="pt-32 px-8 pb-20 max-w-5xl mx-auto z-10 relative">
            <header className="mb-10">
              <p className="text-cyan-600 dark:text-cyan-400 font-bold tracking-[0.3em] uppercase text-[10px] mb-2">Artisan Kitchen</p>
              <h2 className="text-5xl md:text-6xl font-['Playfair_Display'] font-black leading-tight">Curated <br/> <span className="text-gray-400 dark:text-white/30 italic">Experiences.</span></h2>
            </header>

            {menuItems.length === 0 ? (
               <div className="py-20 text-center text-gray-500 animate-pulse font-medium tracking-widest">CONNECTING TO KITCHEN SERVERS...</div>
            ) : (
              <>
                {/* NEW: SEARCH BAR & FILTERS ROW */}
                <div className="flex flex-col md:flex-row gap-6 mb-12 items-start md:items-center justify-between">
                  
                  {/* Category Filters */}
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide w-full md:w-auto">
                    {["All", "Vegan", "Vegetarian", "Meat"].map(f => (
                      <button key={f} onClick={() => { playSound('tap'); setActiveFilter(f); }} className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap ${activeFilter === f ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/10'}`}>{f}</button>
                    ))}
                  </div>

                  {/* Dynamic Search Bar */}
                  <div className="relative w-full md:w-72">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search menu or ingredients..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-medium rounded-full py-3 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-shadow placeholder:text-gray-400 dark:placeholder:text-white/30"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 dark:hover:text-white"><X size={14} /></button>
                    )}
                  </div>
                </div>

                {/* Grid renders the filteredMenu, not the raw menuItems */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {filteredMenu.length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-400 italic">No artisan items match your search.</div>
                  ) : (
                    filteredMenu.map((item) => (
                      <motion.div layout key={item.id} whileHover={{ y: -8 }} className="group relative h-[480px] rounded-[3.5rem] overflow-hidden border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 shadow-xl">
                        <img src={item.img} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.name} />
                        <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-black via-transparent opacity-90" />
                        <div className="absolute bottom-0 w-full p-10">
                          <div className="flex gap-2 mb-4">
                            <span className="bg-gray-100 dark:bg-white/10 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md">{item.tag}</span>
                            <span className="bg-green-500/10 text-green-600 dark:text-green-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md">{item.diet}</span>
                          </div>
                          <h3 className="text-3xl font-['Playfair_Display'] font-bold">{item.name}</h3>
                          <p className="text-xs text-gray-600 dark:text-white/60 mt-2 line-clamp-2">{item.ingredients}</p>
                          <div className="flex justify-between items-center mt-6">
                            <span className="text-xl font-light italic text-gray-500 dark:text-white/80">₹{item.price}</span>
                            <button onClick={() => openAR(item)} className="bg-gray-900 dark:bg-white text-white dark:text-black px-8 py-4 rounded-2xl font-black text-[10px] tracking-widest uppercase active:scale-95 transition-transform">Launch AR</button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </>
            )}
          </motion.main>
        )}

        {/* ... (Cart and AR Views remain identical to the previous version) ... */}
        {view === 'cart' && (
          <motion.div key="cart" initial={{ x: 30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -30, opacity: 0 }} className="pt-32 px-8 max-w-2xl mx-auto pb-48 relative z-10">
            <h2 className="text-5xl font-['Playfair_Display'] font-black mb-12 italic tracking-tight">The <span className="opacity-20 not-italic">Order.</span></h2>
            {cart.length === 0 ? <p className="text-center py-20 text-gray-400 italic font-medium">Your bag is empty. Let's find something delicious.</p> : (
              <div className="space-y-6">
                {cart.map(item => (
                  <motion.div key={item.cartId} layout className="flex gap-6 items-center bg-white dark:bg-white/5 p-6 rounded-[2.5rem] border border-gray-200 dark:border-white/10 shadow-sm">
                    <img src={item.img} className="w-24 h-24 rounded-3xl object-cover" />
                    <div className="flex-1">
                      <h4 className="text-xl font-bold">{item.name}</h4>
                      {item.notes && <p className="text-cyan-500 text-[11px] italic mt-1 font-bold tracking-wide">"{item.notes}"</p>}
                      <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                         <div className="flex items-center gap-5 bg-gray-100 dark:bg-black/40 px-4 py-2 rounded-2xl">
                            <button onClick={() => updateQty(item.cartId, -1)} className="text-gray-400 hover:text-cyan-500"><Minus size={14}/></button>
                            <span className="font-bold text-sm">{item.qty}</span>
                            <button onClick={() => updateQty(item.cartId, 1)} className="text-gray-400 hover:text-cyan-500"><Plus size={14}/></button>
                         </div>
                         <span className="font-black text-lg">₹{item.price * item.qty}</span>
                      </div>
                    </div>
                    <button onClick={() => removeItem(item.cartId)} className="p-4 text-gray-400 hover:text-red-500 transition-colors"><X size={20}/></button>
                  </motion.div>
                ))}
              </div>
            )}
            {cart.length > 0 && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-gray-900 dark:bg-white text-white dark:text-black p-10 rounded-[3.5rem] shadow-2xl z-[200]">
                 <div className="flex justify-between items-center mb-6">
                    <span className="opacity-40 text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                    <span className="text-4xl font-black font-['Playfair_Display']">₹{cartTotal}</span>
                 </div>
                 <button onClick={handleCheckout} className="w-full py-5 bg-cyan-500 text-white rounded-[2rem] font-black tracking-widest text-[11px] uppercase active:scale-95 transition-transform shadow-lg">Confirm Order</button>
              </div>
            )}
          </motion.div>
        )}

        {view === 'ar' && (
          <motion.div key="ar" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black z-[200]">
             <button onClick={() => { playSound('tap'); setView('menu'); }} className="absolute top-10 left-8 z-[300] w-14 h-14 bg-white/10 backdrop-blur-2xl rounded-full flex items-center justify-center border border-white/20 text-white shadow-xl hover:bg-white/20 transition-colors"><ChevronLeft size={24} /></button>
             <iframe ref={iframeRef} src="/ar.html" className="w-full h-full border-none" allow="camera; microphone" />
             
             <AnimatePresence>
              {isXrayOn && aiData && (
                <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="absolute top-28 left-1/2 -translate-x-1/2 w-[90%] max-w-sm z-[350]">
                  <div className="bg-black/60 backdrop-blur-3xl border border-white/20 p-6 rounded-[2.5rem] text-white shadow-2xl">
                    <div className="flex items-center gap-2 mb-4 text-cyan-400">
                      <Zap size={14} className="animate-pulse"/>
                      <span className="text-[10px] font-black uppercase tracking-widest">AI Nutritional Scan</span>
                    </div>
                    {aiData.loading ? (
                      <div className="space-y-2 py-4"><div className="h-4 bg-white/10 rounded animate-pulse w-3/4"></div><div className="h-4 bg-white/10 rounded animate-pulse w-1/2"></div></div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex justify-between border-b border-white/10 pb-4">
                          <div><p className="text-[10px] opacity-50 uppercase font-bold">Calories</p><p className="text-xl font-bold font-['Playfair_Display']">{aiData.cal} kcal</p></div>
                          <div><p className="text-[10px] opacity-50 uppercase font-bold text-right">Protein</p><p className="text-xl font-bold font-['Playfair_Display'] text-right">{aiData.pro}</p></div>
                        </div>
                        <p className="text-xs italic leading-relaxed text-white/80">"{aiData.fact}"</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-[300]">
                <div className="bg-black/60 backdrop-blur-3xl border border-white/20 p-8 rounded-[4rem] shadow-2xl relative overflow-hidden">
                   <div className="flex justify-between items-start mb-8">
                      <div>
                        <h3 className="text-4xl font-['Playfair_Display'] font-black text-white italic">{activeItem?.name}</h3>
                        <span className="text-[9px] font-black text-white/40 uppercase tracking-widest mt-2 block">🕒 {activeItem?.delivery} Delivery</span>
                      </div>
                      <span className="bg-cyan-500 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest">{activeItem?.tag}</span>
                   </div>
                   
                   <div className={`mb-8 p-5 rounded-[2.5rem] border flex items-center gap-5 transition-all duration-500 ${isRecording ? 'bg-red-500/10 border-red-500/50' : 'bg-white/5 border-white/10'}`}>
                      <button onClick={toggleMic} className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-colors ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-black'}`}><Mic size={22} /></button>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-[9px] text-white/30 uppercase font-black tracking-widest mb-1">Voice Customization</p>
                        <p className={`font-medium italic text-sm truncate ${isAiLoading ? 'text-cyan-400 animate-pulse' : 'text-white/80'}`}>{transcript}</p>
                      </div>
                   </div>

                   <div className="flex gap-4">
                      <button onClick={addToCart} disabled={isAiLoading} className="flex-[2.5] py-6 font-black rounded-[2.5rem] text-[11px] tracking-widest uppercase shadow-2xl bg-white text-black active:scale-95 transition-transform">
                        {isAiLoading ? 'Processing...' : `Add To Bag — ₹${activeItem?.price}`}
                      </button>
                      <button onClick={toggleXray} className={`flex-1 py-6 rounded-[2.5rem] font-black border transition-all active:scale-95 ${isXrayOn ? 'bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-transparent border-white/20 text-white hover:bg-white/5'}`}><Info size={22} className="mx-auto" /></button>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}