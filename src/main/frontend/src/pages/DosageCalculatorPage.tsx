import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, 
  User, 
  Baby, 
  Scale, 
  Info, 
  ChevronRight, 
  ShieldAlert,
  Dribbble
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { cn } from '../lib/utils';

type AgeUnit = 'YEARS' | 'MONTHS';
type WeightUnit = 'KG' | 'LBS';

const DosageCalculatorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pediatric' | 'weight-based'>('pediatric');

  // Common States
  const [adultDose, setAdultDose] = useState<string>('500'); // in mg
  const [age, setAge] = useState<string>('5');
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('YEARS');
  const [weight, setWeight] = useState<string>('18');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('KG');
  const [height, setHeight] = useState<string>('110'); // in cm, for BSA

  // Weight-based States
  const [dosagePerKg, setDosagePerKg] = useState<string>('10'); // mg/kg/day or mg/kg/dose
  const [dosageType, setDosageType] = useState<'DAILY' | 'SINGLE'>('DAILY');
  const [frequency, setFrequency] = useState<number>(3); // times per day
  
  // Syrup Concentration States
  const [syrupStrength, setSyrupStrength] = useState<string>('125'); // mg
  const [syrupVolume, setSyrupVolume] = useState<string>('5'); // mL (e.g., 125mg / 5mL)

  // Pediatric Calculations
  const calculations = useMemo(() => {
    const ageVal = parseFloat(age) || 0;
    const weightVal = parseFloat(weight) || 0;
    const heightVal = parseFloat(height) || 0;
    const adultDoseVal = parseFloat(adultDose) || 0;

    if (adultDoseVal <= 0) return null;

    // 1. Young's Rule: Age / (Age + 12) * Adult Dose (for 1 - 12 years)
    let youngDose = 0;
    if (ageUnit === 'YEARS' && ageVal >= 1 && ageVal <= 12) {
      youngDose = (ageVal / (ageVal + 12)) * adultDoseVal;
    }

    // 2. Dilling's Rule: Age / 20 * Adult Dose (for > 12 years)
    let dillingDose = 0;
    if (ageUnit === 'YEARS' && ageVal >= 12) {
      dillingDose = (ageVal / 20) * adultDoseVal;
    }

    // 3. Fried's Rule: (Age in months / 150) * Adult Dose (for infants < 1 year)
    let friedDose = 0;
    const ageInMonths = ageUnit === 'MONTHS' ? ageVal : ageVal * 12;
    if (ageInMonths < 12 && ageInMonths > 0) {
      friedDose = (ageInMonths / 150) * adultDoseVal;
    }

    // 4. Clark's Rule: (Weight in lbs / 150) * Adult Dose
    // Or (Weight in kg / 68) * Adult Dose
    const weightInLbs = weightUnit === 'LBS' ? weightVal : weightVal * 2.20462;
    const clarkDose = weightVal > 0 ? (weightInLbs / 150) * adultDoseVal : 0;

    // 5. BSA (Body Surface Area) - Mosteller Formula
    // BSA = sqrt( (Height cm * Weight kg) / 3600 )
    // BSA Dose = (BSA / 1.73) * Adult Dose
    let bsa = 0;
    let bsaDose = 0;
    if (heightVal > 0 && weightVal > 0) {
      const weightInKg = weightUnit === 'KG' ? weightVal : weightVal / 2.20462;
      bsa = Math.sqrt((heightVal * weightInKg) / 3600);
      bsaDose = (bsa / 1.73) * adultDoseVal;
    }

    return {
      young: parseFloat(youngDose.toFixed(2)),
      dilling: parseFloat(dillingDose.toFixed(2)),
      fried: parseFloat(friedDose.toFixed(2)),
      clark: parseFloat(clarkDose.toFixed(2)),
      bsa: parseFloat(bsa.toFixed(3)),
      bsaDose: parseFloat(bsaDose.toFixed(2))
    };
  }, [age, ageUnit, weight, weightUnit, height, adultDose]);

  // Weight-based Calculations
  const weightBasedCalculations = useMemo(() => {
    const weightVal = parseFloat(weight) || 0;
    const dosagePerKgVal = parseFloat(dosagePerKg) || 0;
    const strengthVal = parseFloat(syrupStrength) || 0;
    const volumeVal = parseFloat(syrupVolume) || 0;
    
    if (weightVal <= 0 || dosagePerKgVal <= 0) return null;

    const weightInKg = weightUnit === 'KG' ? weightVal : weightVal / 2.20462;
    
    let totalDailyDose = 0;
    let singleDose = 0;

    if (dosageType === 'DAILY') {
      totalDailyDose = dosagePerKgVal * weightInKg;
      singleDose = totalDailyDose / (frequency || 1);
    } else {
      singleDose = dosagePerKgVal * weightInKg;
      totalDailyDose = singleDose * (frequency || 1);
    }

    // Syrup volume calculation: (Dose required / Strength) * Volume sediaan
    let syrupVolumePerDose = 0;
    if (strengthVal > 0 && volumeVal > 0) {
      syrupVolumePerDose = (singleDose / strengthVal) * volumeVal;
    }

    return {
      totalDailyDose: parseFloat(totalDailyDose.toFixed(2)),
      singleDose: parseFloat(singleDose.toFixed(2)),
      syrupVolumePerDose: parseFloat(syrupVolumePerDose.toFixed(2))
    };
  }, [weight, weightUnit, dosagePerKg, dosageType, frequency, syrupStrength, syrupVolume]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Calculator className="w-6 h-6 text-emerald-600 animate-pulse" />
          Kalkulator Perhitungan Dosis
        </h1>
        <p className="text-slate-500 text-sm">Alat bantu penentu takaran dosis obat pediatrik dan dosis berdasarkan parameter klinis pasien.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab('pediatric')}
          className={cn(
            "px-6 py-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'pediatric'
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <Baby className="w-4 h-4" />
          Dosis Pediatrik (Rumus Klasik)
        </button>
        <button
          onClick={() => setActiveTab('weight-based')}
          className={cn(
            "px-6 py-3 text-sm font-extrabold border-b-2 transition-all flex items-center gap-2",
            activeTab === 'weight-based'
              ? "border-emerald-500 text-emerald-600"
              : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          <Scale className="w-4 h-4" />
          Dosis Berat Badan & Sediaan Cair
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Input Form */}
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-500" />
              Parameter Pasien & Obat
            </h3>
            <p className="text-xs text-slate-400">Masukkan kondisi klinis pasien untuk menghitung dosis.</p>
          </div>

          {/* Adult Standard Dose (Used for Tab 1) */}
          {activeTab === 'pediatric' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dosis Dewasa Standar (mg)</label>
              <div className="relative">
                <Input 
                  type="number" 
                  value={adultDose} 
                  onChange={(e) => setAdultDose(e.target.value)} 
                  placeholder="Misal: 500" 
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">mg</span>
              </div>
            </div>
          )}

          {/* Patient Age Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Umur Pasien</label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                value={age} 
                onChange={(e) => setAge(e.target.value)} 
                placeholder="Misal: 5" 
                className="flex-1"
              />
              <select
                value={ageUnit}
                onChange={(e) => setAgeUnit(e.target.value as AgeUnit)}
                className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="YEARS">Tahun</option>
                <option value="MONTHS">Bulan</option>
              </select>
            </div>
          </div>

          {/* Patient Weight Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Berat Badan</label>
            <div className="flex gap-2">
              <Input 
                type="number" 
                value={weight} 
                onChange={(e) => setWeight(e.target.value)} 
                placeholder="Misal: 18" 
                className="flex-1"
              />
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value as WeightUnit)}
                className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
              >
                <option value="KG">Kg</option>
                <option value="LBS">Lbs</option>
              </select>
            </div>
          </div>

          {/* Patient Height Input (For BSA) */}
          {activeTab === 'pediatric' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Tinggi Badan (Untuk BSA)</label>
              <div className="relative">
                <Input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(e.target.value)} 
                  placeholder="Misal: 110" 
                  className="pr-12"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">cm</span>
              </div>
            </div>
          )}

          {/* Extra inputs for Tab 2: Weight-based Dosage parameters */}
          {activeTab === 'weight-based' && (
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 pt-2 border-t border-slate-50 overflow-hidden"
              >
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Dosis Anjuran per Kg</label>
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      value={dosagePerKg} 
                      onChange={(e) => setDosagePerKg(e.target.value)} 
                      placeholder="Misal: 10" 
                      className="flex-1"
                    />
                    <select
                      value={dosageType}
                      onChange={(e) => setDosageType(e.target.value as 'DAILY' | 'SINGLE')}
                      className="h-10 px-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                    >
                      <option value="DAILY">mg/kg/hari</option>
                      <option value="SINGLE">mg/kg/kali</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Frekuensi Pemberian</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(parseInt(e.target.value))}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
                  >
                    <option value={1}>1 kali sehari (Tiap 24 Jam)</option>
                    <option value={2}>2 kali sehari (Tiap 12 Jam)</option>
                    <option value={3}>3 kali sehari (Tiap 8 Jam)</option>
                    <option value={4}>4 kali sehari (Tiap 6 Jam)</option>
                  </select>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-50">
                  <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest block">Kekuatan Sediaan Cair (Sirup)</span>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Kandungan Obat (mg)</label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={syrupStrength} 
                          onChange={(e) => setSyrupStrength(e.target.value)} 
                          placeholder="125"
                          className="pr-8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">mg</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500">Per Volume (mL)</label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={syrupVolume} 
                          onChange={(e) => setSyrupVolume(e.target.value)} 
                          placeholder="5"
                          className="pr-8"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400">mL</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 italic">Contoh: Paracetamol Sirup 125 mg / 5 mL.</p>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

        </div>

        {/* Right Side: Calculation Results & Explanations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tab 1 View: Pediatric Calculations */}
          {activeTab === 'pediatric' && calculations && (
            <div className="space-y-6">
              
              {/* Output Summary Card */}
              <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                  <Baby className="w-48 h-48" />
                </div>
                <h3 className="text-xs uppercase font-black text-emerald-400 tracking-widest">Rekomendasi Dosis Pediatrik Utama</h3>
                
                {/* We use Clark's Rule (if weight is entered) or Young's Rule as primary indicators */}
                <div className="mt-4 flex flex-wrap items-baseline gap-4">
                  <div>
                    <p className="text-xs text-white/50 font-bold">Berdasarkan Berat Badan (Clark):</p>
                    <h2 className="text-4xl font-black mt-1 text-emerald-300">
                      {calculations.clark > 0 ? `${calculations.clark} mg` : '-'}
                    </h2>
                  </div>
                  <div className="border-l border-white/10 pl-4">
                    <p className="text-xs text-white/50 font-bold">Berdasarkan Umur (Young):</p>
                    <h2 className="text-4xl font-black mt-1 text-sky-300">
                      {calculations.young > 0 ? `${calculations.young} mg` : '-'}
                    </h2>
                  </div>
                </div>

                <div className="mt-6 flex gap-2 items-center text-xs text-white/60 bg-white/5 p-3 rounded-2xl border border-white/5">
                  <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p>Selalu prioritaskan rumus berdasarkan **Berat Badan** jika berat badan pasien diketahui secara pasti.</p>
                </div>
              </div>

              {/* Grid of Formulas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Young's Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Rumus Young</span>
                      <span className="text-xs text-slate-400">(Usia 1 - 12 Tahun)</span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-lg mt-3">
                      {calculations.young > 0 ? `${calculations.young} mg` : 'Tidak Berlaku'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Formula: `[Umur / (Umur + 12)] * Dosis Dewasa`</p>
                  </div>
                  {calculations.young > 0 && (
                    <div className="text-[10px] text-slate-500 font-bold bg-slate-50 p-2 rounded-lg mt-3 border border-slate-100">
                      Perhitungan: `({age} / ({age} + 12)) * {adultDose} = {calculations.young} mg`
                    </div>
                  )}
                </div>

                {/* Dilling's Card */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Rumus Dilling</span>
                      <span className="text-xs text-slate-400">(Usia ≥ 12 Tahun)</span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-lg mt-3">
                      {calculations.dilling > 0 ? `${calculations.dilling} mg` : 'Tidak Berlaku'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Formula: `(Umur / 20) * Dosis Dewasa`</p>
                  </div>
                  {calculations.dilling > 0 && (
                    <div className="text-[10px] text-slate-500 font-bold bg-slate-50 p-2 rounded-lg mt-3 border border-slate-100">
                      Perhitungan: `({age} / 20) * {adultDose} = {calculations.dilling} mg`
                    </div>
                  )}
                </div>

                {/* Fried's Card (Infants) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Rumus Fried</span>
                      <span className="text-xs text-slate-400">(Bayi &lt; 1 Tahun)</span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-lg mt-3">
                      {calculations.fried > 0 ? `${calculations.fried} mg` : 'Tidak Berlaku'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Formula: `(Usia Bulan / 150) * Dosis Dewasa`</p>
                  </div>
                  {calculations.fried > 0 && (
                    <div className="text-[10px] text-slate-500 font-bold bg-slate-50 p-2 rounded-lg mt-3 border border-slate-100">
                      Perhitungan: `({ageUnit === 'MONTHS' ? age : `${parseFloat(age) * 12}`} / 150) * {adultDose} = {calculations.fried} mg`
                    </div>
                  )}
                </div>

                {/* Clark's Card (Weight) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Rumus Clark</span>
                      <span className="text-xs text-slate-400">(Berdasarkan Berat Badan)</span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-lg mt-3">
                      {calculations.clark > 0 ? `${calculations.clark} mg` : 'Masukkan Berat Badan'}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">Formula: `(Berat Lbs / 150) * Dosis Dewasa`</p>
                  </div>
                  {calculations.clark > 0 && (
                    <div className="text-[10px] text-slate-500 font-bold bg-slate-50 p-2 rounded-lg mt-3 border border-slate-100">
                      Perhitungan: `({(parseFloat(weight) * (weightUnit === 'KG' ? 2.20462 : 1)).toFixed(1)} Lbs / 150) * {adultDose} = {calculations.clark} mg`
                    </div>
                  )}
                </div>

                {/* BSA / Body Surface Area (Mosteller) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between md:col-span-2">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                      <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Rumus BSA (Mosteller)</span>
                      <p className="text-xs text-slate-400 mt-1">Sangat akurat karena menghitung tinggi & berat badan sekaligus.</p>
                      <div className="mt-2 flex gap-4">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400">BSA Pasien</p>
                          <p className="text-sm font-extrabold text-slate-700">{calculations.bsa > 0 ? `${calculations.bsa} m²` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400">Dosis yang Disarankan</p>
                          <p className="text-sm font-extrabold text-rose-600">{calculations.bsaDose > 0 ? `${calculations.bsaDose} mg` : 'Masukkan TB & BB'}</p>
                        </div>
                      </div>
                    </div>
                    {calculations.bsaDose > 0 && (
                      <div className="text-[10px] text-slate-500 font-bold bg-slate-50 p-3 rounded-lg border border-slate-100 md:max-w-xs">
                        Formula: `(BSA / 1.73) * Dosis Dewasa` <br />
                        `({calculations.bsa} / 1.73) * {adultDose} = {calculations.bsaDose} mg`
                      </div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* Tab 2 View: Weight-based and Syrup Volume */}
          {activeTab === 'weight-based' && weightBasedCalculations && (
            <div className="space-y-6">
              
              {/* Output Main Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Daily Total Dose */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Dosis Total Harian</span>
                    <h3 className="text-3xl font-black text-slate-800 mt-3">{weightBasedCalculations.totalDailyDose} mg</h3>
                    <p className="text-xs text-slate-400 mt-1">Dosis total yang dibutuhkan pasien dalam 24 Jam.</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Scale className="w-6 h-6" />
                  </div>
                </div>

                {/* Dose Per Administration */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider">Dosis Sekali Pemberian</span>
                    <h3 className="text-3xl font-black text-slate-800 mt-3">{weightBasedCalculations.singleDose} mg</h3>
                    <p className="text-xs text-slate-400 mt-1">Dosis sekali minum ({frequency}x sehari).</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-sky-50 flex items-center justify-center text-sky-600">
                    <User className="w-6 h-6" />
                  </div>
                </div>

              </div>

              {/* Syrup Volume Box */}
              {parseFloat(syrupStrength) > 0 && (
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-6 rounded-3xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-md">
                      <Dribbble className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-emerald-900 text-base">Hasil Konversi Takaran Sirup</h4>
                      <p className="text-xs text-emerald-700">Takaran sendok / mililiter (mL) untuk sekali minum.</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-emerald-200/60 shadow-sm">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-400 font-bold">Kebutuhan Sekali Minum:</p>
                      <h2 className="text-3xl font-black text-emerald-600">
                        {weightBasedCalculations.syrupVolumePerDose} mL
                      </h2>
                      <p className="text-[10px] text-slate-400">
                        ({weightBasedCalculations.singleDose} mg ÷ {syrupStrength} mg) x {syrupVolume} mL
                      </p>
                    </div>

                    <div className="border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6 space-y-2">
                      <span className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Panduan Takaran Sendok:</span>
                      <div className="space-y-1 text-xs font-semibold text-slate-700">
                        <p className="flex items-center gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                          Sendok Takar (5 mL): <span className="font-black text-emerald-600">{(weightBasedCalculations.syrupVolumePerDose / 5).toFixed(2)} cth</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-500" />
                          Sendok Teh (2.5 mL): <span className="font-black text-emerald-600">{(weightBasedCalculations.syrupVolumePerDose / 2.5).toFixed(2)} cth</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* Safety & Educational Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-800 flex items-center gap-2 text-sm">
              <ShieldAlert className="w-4 h-4 text-amber-500 animate-bounce" />
              Peringatan Keamanan Penggunaan Obat
            </h4>
            <ul className="text-xs text-slate-500 space-y-2 list-disc list-inside leading-relaxed">
              <li>**Gunakan Alat Takar yang Tepat:** Selalu sarankan pasien menggunakan sendok takar obat resmi yang ada di dalam kemasan sirup, bukan sendok makan rumahan.</li>
              <li>**Verifikasi Batas Maksimal:** Hasil perhitungan di atas hanyalah referensi teoritis berdasarkan rumus standar. Jangan melebihi dosis maksimal harian dewasa yang diizinkan untuk zat aktif tersebut.</li>
              <li>**Kondisi Khusus:** Untuk pasien anak dengan obesitas (overweight) atau kondisi gangguan ginjal/hati, penyesuaian dosis klinis oleh dokter sangat diperlukan.</li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
};

export default DosageCalculatorPage;
