import React, { useState } from 'react';
import { ChevronRight, CheckCircle, BookOpen, Zap, Clock, Target } from 'lucide-react';

const SimPCLecture = ({ onStart, activity }) => {
  const [activeTab, setActiveTab] = useState('introduction');

  const tabs = [
    { id: 'introduction', label: 'Introduction', icon: BookOpen },
    { id: 'objectives', label: 'Learning Goals', icon: Target },
    { id: 'mechanics', label: 'How to Play', icon: Zap },
    { id: 'grading', label: 'Grading Criteria', icon: CheckCircle },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'introduction':
        return (
          <div className="space-y-4">
            <p className="text-gray-200 leading-relaxed">
              Welcome to the <span className="font-bold text-blue-400">PC Building Simulator</span>! 
              This interactive simulation teaches you about computer hardware components and how they work together.
            </p>
            <p className="text-gray-200 leading-relaxed">
              You'll be tasked with building a functioning PC by correctly installing three critical components:
            </p>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl mb-2">🔌</div>
                <h3 className="font-semibold text-white">CPU</h3>
                <p className="text-xs text-gray-400 mt-2">Central Processing Unit - the brain of your computer</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl mb-2">⚙️</div>
                <h3 className="font-semibold text-white">CMOS</h3>
                <p className="text-xs text-gray-400 mt-2">System battery - stores BIOS settings</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl mb-2">📦</div>
                <h3 className="font-semibold text-white">RAM</h3>
                <p className="text-xs text-gray-400 mt-2">Memory modules - temporary data storage</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mt-6 p-3 bg-blue-900/30 rounded border border-blue-700/50">
              💡 <span className="font-semibold">Tip:</span> Each component has a specific location on the motherboard. Pay attention to the visual guides and follow the correct sequence!
            </p>
          </div>
        );

      case 'objectives':
        return (
          <div className="space-y-4">
            <p className="text-gray-200 leading-relaxed">
              By completing this activity, you will:
            </p>
            <div className="space-y-3 mt-4">
              {[
                { title: 'Identify Hardware', desc: 'Recognize major PC components and their functions' },
                { title: 'Learn Proper Assembly', desc: 'Understand correct installation procedures and safety' },
                { title: 'Understand Compatibility', desc: 'Learn how components work together in a system' },
                { title: 'Build Problem-Solving Skills', desc: 'Apply logic to overcome assembly challenges' },
                { title: 'Develop Procedural Knowledge', desc: 'Master step-by-step hardware installation' },
              ].map((obj, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-gray-800 rounded border border-gray-700">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-white">{obj.title}</h4>
                    <p className="text-sm text-gray-400">{obj.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'mechanics':
        return (
          <div className="space-y-4">
            <p className="text-gray-200 leading-relaxed">
              Here's how to play the SimPC activity:
            </p>
            <div className="space-y-3 mt-4">
              {[
                { step: '1', title: 'Select a Component', desc: 'Click on a component from the left panel to activate it' },
                { step: '2', title: 'Drag to Location', desc: 'Drag the selected component to its correct position on the motherboard' },
                { step: '3', title: 'Precise Placement', desc: 'Align it properly - visual guides show the correct location' },
                { step: '4', title: 'Confirm Installation', desc: 'Release to install - if correct, the component locks in place' },
                { step: '5', title: 'Complete All Tasks', desc: 'Repeat for all components (CPU → CMOS → RAM)' },
                { step: '6', title: 'Submit Your Work', desc: 'Once all components are installed, submit to see your score' },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-3 p-3 bg-gray-800 rounded border border-gray-700">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0 text-sm font-bold">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-white">{item.title}</h4>
                    <p className="text-sm text-gray-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-yellow-900/30 rounded border border-yellow-700/50 text-sm text-gray-200">
              ⚠️ <span className="font-semibold">Important:</span> Complete components in the correct order: CPU → CMOS → RAM. Following the sequence affects your final score!
            </div>
          </div>
        );

      case 'grading':
        return (
          <div className="space-y-4">
            <p className="text-gray-200 leading-relaxed">
              Your performance is evaluated based on these criteria:
            </p>
            <div className="space-y-3 mt-4">
              {[
                { 
                  criterion: 'Completion', 
                  weight: '100%', 
                  desc: 'Install all 3 components correctly to receive a passing grade',
                  color: 'text-green-400'
                },
                { 
                  criterion: 'Sequence', 
                  weight: 'Critical', 
                  desc: 'Follow the correct installation order (CPU → CMOS → RAM) for full points',
                  color: 'text-blue-400'
                },
                { 
                  criterion: 'Accuracy', 
                  weight: '40%', 
                  desc: 'Place each component in exactly the right location',
                  color: 'text-purple-400'
                },
                { 
                  criterion: 'Efficiency', 
                  weight: '30%', 
                  desc: 'Work as quickly as possible - bonus points for speed',
                  color: 'text-orange-400'
                },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-800 rounded border border-gray-700">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`font-semibold ${item.color}`}>{item.criterion}</h4>
                    <span className="text-xs font-semibold text-gray-400 bg-gray-900 px-2 py-1 rounded">{item.weight}</span>
                  </div>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-blue-900/40 to-purple-900/40 rounded border border-blue-700/50">
              <div className="flex gap-2 mb-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <h4 className="font-semibold text-white">Score Ranges</h4>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-3">
                {[
                  { grade: 'A', range: '90-100%', color: 'bg-green-600' },
                  { grade: 'B', range: '80-89%', color: 'bg-blue-600' },
                  { grade: 'C', range: '70-79%', color: 'bg-yellow-600' },
                  { grade: 'D', range: '60-69%', color: 'bg-orange-600' },
                  { grade: 'F', range: '<60%', color: 'bg-red-600' },
                ].map((item, idx) => (
                  <div key={idx} className={`${item.color} rounded p-2 text-center`}>
                    <div className="font-bold text-white">{item.grade}</div>
                    <div className="text-xs text-white/80">{item.range}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-6 border-b border-gray-700 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              PC Building Simulator
            </h1>
            <p className="text-gray-400 mt-2">Master the art of hardware assembly</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 rounded border border-blue-600/50 text-sm text-blue-300">
            <BookOpen className="w-4 h-4" />
            Learning Module
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 border-b border-gray-700 bg-gray-900/50">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium text-sm transition-all border-b-2 ${
                  isActive
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 p-6 bg-gray-900/50 flex justify-between items-center">
          <p className="text-sm text-gray-400">
            ✓ Review all sections to prepare for the activity
          </p>
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg"
          >
            Start Activity
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SimPCLecture;
