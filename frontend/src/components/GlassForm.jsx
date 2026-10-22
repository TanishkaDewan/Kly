import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

export const GlassForm = ({
  title = 'Secure Access',
  subtitle = 'Enter your credentials to float.',
  icon = <Lock className="text-white w-6 h-6" />,
  fields = [
    { placeholder: 'Email', type: 'email' },
    { placeholder: 'Password', type: 'password' },
  ],
  buttonText = 'Authenticate',
  onSubmit,
  maxWidth = '28rem',
  backgroundGradientFrom = '#070b12',
  backgroundGradientVia = '#0f172a',
  backgroundGradientTo = '#1e1b4b',
  blob1Color = '#22d3ee',
  blob2Color = '#6366f1',
  blob3Color = '#a855f7',
  blobSize = '12rem',
  blobBlur = 'xl',
  cardBgColor = 'rgba(255, 255, 255, 0.03)',
  cardBorderColor = 'rgba(255, 255, 255, 0.15)',
  iconBgColor = 'rgba(34, 211, 238, 0.15)',
  iconColor = '#22d3ee',
  titleColor = '#ffffff',
  subtitleColor = 'rgba(255, 255, 255, 0.65)',
  inputBgColor = 'rgba(7, 11, 18, 0.6)',
  inputBorderColor = 'rgba(255, 255, 255, 0.12)',
  inputFocusBgColor = 'rgba(7, 11, 18, 0.9)',
  inputFocusBorderColor = 'rgba(34, 211, 238, 0.5)',
  inputTextColor = '#ffffff',
  inputPlaceholderColor = 'rgba(255, 255, 255, 0.35)',
  buttonGradientFrom = 'rgba(34, 211, 238, 0.9)',
  buttonGradientTo = 'rgba(99, 102, 241, 0.9)',
  buttonTextColor = '#070b12',
  buttonBorderColor = 'rgba(34, 211, 238, 0.3)',
  buttonShadowColor = 'rgba(34, 211, 238, 0.4)',
  shimmerColor = 'rgba(255, 255, 255, 0.05)',
  className = '',
  extraContent = null,
}) => {
  const [formData, setFormData] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(formData);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden select-none"
      style={{
        background: `linear-gradient(to bottom right, ${backgroundGradientFrom}, ${backgroundGradientVia}, ${backgroundGradientTo})`,
      }}
    >
      {/* Floating Glowing Animated Blobs */}
      <div
        className="absolute top-10 left-10 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob pointer-events-none"
        style={{
          width: blobSize,
          height: blobSize,
          backgroundColor: blob1Color,
        }}
      />
      <div
        className="absolute top-1/4 right-10 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-2000 pointer-events-none"
        style={{
          width: blobSize,
          height: blobSize,
          backgroundColor: blob2Color,
        }}
      />
      <div
        className="absolute -bottom-8 left-1/3 rounded-full mix-blend-screen filter blur-3xl opacity-40 animate-blob animation-delay-4000 pointer-events-none"
        style={{
          width: blobSize,
          height: blobSize,
          backgroundColor: blob3Color,
        }}
      />

      {/* Glass Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className={`w-full backdrop-blur-2xl border p-8 sm:p-9 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.7)] relative z-10 ${className}`}
        style={{
          maxWidth,
          backgroundColor: cardBgColor,
          borderColor: cardBorderColor,
        }}
      >
        <div className="text-center mb-8">
          <div
            className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 border border-white/10 shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-transform hover:scale-105 duration-300"
            style={{ backgroundColor: iconBgColor }}
          >
            <div style={{ color: iconColor }}>{icon}</div>
          </div>
          <h2
            className="text-2xl font-jakarta font-bold tracking-wide"
            style={{ color: titleColor }}
          >
            {title}
          </h2>
          <p
            className="text-sm font-sans mt-2 font-normal"
            style={{ color: subtitleColor }}
          >
            {subtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field, i) => (
            <div key={i} className="relative group">
              <input
                type={field.type || 'text'}
                required={field.required !== false}
                value={formData[field.name || field.placeholder] || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    [field.name || field.placeholder]: e.target.value,
                  })
                }
                className="w-full border rounded-xl px-4 py-3 text-sm focus:outline-none transition-all duration-200"
                style={{
                  backgroundColor: inputBgColor,
                  borderColor: inputBorderColor,
                  color: inputTextColor,
                }}
                placeholder={field.placeholder}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = inputFocusBgColor;
                  e.currentTarget.style.borderColor = inputFocusBorderColor;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = inputBgColor;
                  e.currentTarget.style.borderColor = inputBorderColor;
                }}
              />
            </div>
          ))}

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 mt-2 rounded-xl font-jakarta font-bold text-sm tracking-wider uppercase shadow-lg transition-all duration-300 border flex items-center justify-center gap-2 cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${buttonGradientFrom}, ${buttonGradientTo})`,
              color: buttonTextColor,
              borderColor: buttonBorderColor,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = `0 10px 25px ${buttonShadowColor}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
            }}
          >
            {buttonText}
          </motion.button>
        </form>

        {extraContent}
      </motion.div>
    </div>
  );
};

export default GlassForm;
