"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { 
  Calendar, 
  Users, 
  Zap, 
  Shield, 
  Sparkles,
  CheckCircle2,
  Clock
} from "lucide-react";

const SLIDES = [
  {
    id: 1,
    title: "Effortless Scheduling",
    description: "Simplify your scheduling workflow and keep meetings organized in one place.",
    icon: <Calendar className="w-6 h-6 text-teal-600" />,
    color: "teal",
    mock: "calendar"
  },
  {
    id: 2,
    title: "Team Coordination",
    description: "Manage your team's availability and shared booking flows with ease.",
    icon: <Users className="w-6 h-6 text-blue-600" />,
    color: "blue",
    mock: "team"
  },
  {
    id: 3,
    title: "Smart Automations",
    description: "Automate reminders, follow-ups, and sync with your favorite tools.",
    icon: <Zap className="w-6 h-6 text-amber-600" />,
    color: "amber",
    mock: "automations"
  }
];

export function AuthShowcase() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-zinc-950 flex flex-col items-center justify-center px-8 lg:px-16 py-20">
      {/* Premium Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-teal-500/10 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-500/10 rounded-full blur-[130px] animate-pulse" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-amber-500/5 rounded-full blur-[110px]" />
        
        {/* Subtle Grid */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }} 
        />
      </div>

      <div className="relative z-10 w-full max-w-2xl mx-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-center md:text-left"
          >
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 mb-6 shadow-2xl`}>
              {SLIDES[current].icon}
              <span className="text-sm font-medium text-zinc-300">
                {SLIDES[current].title}
              </span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-bold text-white tracking-tight leading-[1.05] mb-6">
              Elevate your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
                Booking Experience
              </span>
            </h2>
            
            <p className="text-xl text-zinc-400 leading-relaxed max-w-xl mx-auto md:mx-0">
              {SLIDES[current].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Floating Mock UI Elements */}
        <div className="mt-12 relative h-[350px] w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              {SLIDES[current].mock === "calendar" && <CalendarMock />}
              {SLIDES[current].mock === "team" && <TeamMock />}
              {SLIDES[current].mock === "automations" && <AutomationsMock />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-12 left-12 flex gap-3 z-10">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-500 ${
              current === i ? "w-8 bg-teal-500" : "w-1.5 bg-zinc-800 hover:bg-zinc-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function CalendarMock() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div 
        className="relative z-10 w-full max-w-[420px] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center justify-between mb-5 border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-teal-400" />
            <span className="text-sm font-semibold text-zinc-200">Upcoming Meetings</span>
          </div>
          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">Today</span>
        </div>
        <div className="space-y-4">
          {[
            { time: "10:00 AM", event: "Product Strategy Sync", tag: "High" },
            { time: "01:30 PM", event: "Client Onboarding", tag: "New" },
            { time: "04:00 PM", event: "Design Review", tag: "Draft" }
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between group p-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors">
              <div className="flex gap-4 items-center">
                <span className="text-xs font-mono text-teal-500/80">{item.time}</span>
                <span className="text-sm text-zinc-300 group-hover:text-white transition-colors">{item.event}</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-zinc-800 text-zinc-500 border border-zinc-700">
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-4 right-[-20px] lg:right-0 w-[220px] bg-teal-500/10 backdrop-blur-md border border-teal-500/20 rounded-xl p-4 shadow-2xl z-20"
        animate={{ y: [0, 8, 0], x: [0, -4, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
          <span className="text-xs font-medium text-teal-300">Active Session</span>
        </div>
        <p className="text-xs text-zinc-300">Google Meet link generated for next meeting.</p>
      </motion.div>
    </div>
  );
}

function TeamMock() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div 
        className="relative z-10 w-full max-w-[400px] bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="flex -space-x-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="w-9 h-9 rounded-full border-2 border-zinc-900 bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400 overflow-hidden">
                <img src={`https://i.pravatar.cc/100?u=${i + 20}`} alt="Avatar" className="w-full h-full object-cover opacity-80" />
              </div>
            ))}
          </div>
          <span className="text-sm font-semibold text-zinc-200">Availability Sync</span>
        </div>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Round Robin Scheduling</span>
            <div className="w-10 h-5 rounded-full bg-teal-600/20 border border-teal-500/30 flex items-center px-1">
              <div className="w-3 h-3 rounded-full bg-teal-500" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">Host Rotation</span>
            <div className="w-10 h-5 rounded-full bg-zinc-800 border border-zinc-700" />
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="absolute top-0 left-[-20px] lg:left-0 w-[240px] bg-blue-500/10 backdrop-blur-md border border-blue-500/20 rounded-xl p-4 shadow-2xl z-20"
        animate={{ y: [0, 10, 0], rotate: [0, 2, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-xs font-medium text-blue-300">Team Insights</span>
        </div>
        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-blue-500"
            initial={{ width: "0%" }}
            animate={{ width: "85%" }}
            transition={{ duration: 2, delay: 1 }}
          />
        </div>
        <p className="text-[10px] text-zinc-400 mt-3">85% team utilization this week.</p>
      </motion.div>
    </div>
  );
}

function AutomationsMock() {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <motion.div 
        className="relative z-10 w-full max-w-[340px] bg-zinc-900 border border-zinc-800 rounded-2xl p-7 shadow-2xl"
        animate={{ y: [0, -15, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
            <Zap className="w-6 h-6 text-amber-500" />
          </div>
          <h4 className="text-base font-semibold text-zinc-200 mb-2">Workflow Active</h4>
          <p className="text-xs text-zinc-500 mb-8">Reminder sent to 12 participants</p>
          
          <div className="w-full space-y-3">
            <div className="h-2.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-amber-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </div>
            <div className="flex justify-between text-[10px] font-mono text-zinc-600 tracking-widest">
              <span>SYNCING DATA</span>
              <span>100%</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div 
        className="absolute top-1/4 right-[-20px] lg:right-0 w-[160px] bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl z-20"
        animate={{ x: [0, 10, 0], y: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
      >
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-medium text-zinc-300">Email Sent</span>
        </div>
      </motion.div>
      
      <motion.div 
        className="absolute bottom-1/4 left-[-20px] lg:left-0 w-[160px] bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl z-20"
        animate={{ x: [0, -10, 0], y: [0, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1.2 }}
      >
        <div className="flex items-center gap-3">
          <Clock className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-medium text-zinc-300">Reminder Set</span>
        </div>
      </motion.div>
    </div>
  );
}
