import { useState, useEffect } from 'react';
import { Calendar, Clock, Check } from 'lucide-react';
import toast from 'react-hot-toast';

interface Props {
  value: string;
  onChange: (val: string) => void;
  label?: string;
}

const DAYS_OF_WEEK = [
  { id: 'T2', label: 'Thứ 2' },
  { id: 'T3', label: 'Thứ 3' },
  { id: 'T4', label: 'Thứ 4' },
  { id: 'T5', label: 'Thứ 5' },
  { id: 'T6', label: 'Thứ 6' },
  { id: 'T7', label: 'Thứ 7' },
  { id: 'CN', label: 'Chủ nhật' },
];

export default function FreeTimePicker({ value, onChange, label = 'Thời gian rảnh' }: Props) {
  const [mode, setMode] = useState<'weekly' | 'specific' | 'manual'>('weekly');
  const [selectedDays, setSelectedDays] = useState<string[]>(['T2', 'T3', 'T4', 'T5', 'T6']);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('21:00');

  const [specificDate, setSpecificDate] = useState('');
  const [manualText, setManualText] = useState(value || '');

  useEffect(() => {
    setManualText(value || '');
  }, [value]);

  const toggleDay = (dayId: string) => {
    if (selectedDays.includes(dayId)) {
      setSelectedDays(selectedDays.filter(d => d !== dayId));
    } else {
      setSelectedDays([...selectedDays, dayId]);
    }
  };

  const applyWeeklyTime = () => {
    if (selectedDays.length === 0) {
      toast.error('Vui lòng chọn ít nhất một ngày trong tuần!');
      return;
    }
    if (startTime >= endTime) {
      toast.error('Giờ kết thúc phải lớn hơn giờ bắt đầu!');
      return;
    }
    const daysStr = selectedDays.length === 7 
      ? 'Hàng ngày' 
      : selectedDays.length === 5 && !selectedDays.includes('T7') && !selectedDays.includes('CN')
        ? 'Thứ 2 - Thứ 6'
        : selectedDays.map(d => DAYS_OF_WEEK.find(item => item.id === d)?.label).join(', ');
    
    const result = `${daysStr}, ${startTime} - ${endTime}`;
    onChange(result);
    setManualText(result);
    toast.success('Đã áp dụng lịch tuần!');
  };

  const applySpecificDate = () => {
    if (!specificDate) {
      toast.error('Vui lòng chọn ngày trước khi áp dụng!');
      return;
    }
    if (startTime >= endTime) {
      toast.error('Giờ kết thúc phải lớn hơn giờ bắt đầu!');
      return;
    }
    const [y, m, d] = specificDate.split('-');
    const formattedDate = `${d}/${m}/${y}`;
    const result = `${formattedDate}, ${startTime} - ${endTime}`;
    onChange(result);
    setManualText(result);
    toast.success('Đã áp dụng ngày cụ thể!');
  };

  return (
    <div className="space-y-2 bg-slate-50 border border-slate-200 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-slate-700">
          {label}
        </label>
        <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-xs font-medium">
          <button
            type="button"
            onClick={() => setMode('weekly')}
            className={`px-2.5 py-1 rounded-md transition ${mode === 'weekly' ? 'bg-white text-slate-800 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Lịch tuần
          </button>
          <button
            type="button"
            onClick={() => setMode('specific')}
            className={`px-2.5 py-1 rounded-md transition ${mode === 'specific' ? 'bg-white text-slate-800 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Ngày cụ thể
          </button>
          <button
            type="button"
            onClick={() => setMode('manual')}
            className={`px-2.5 py-1 rounded-md transition ${mode === 'manual' ? 'bg-white text-slate-800 shadow-sm font-semibold' : 'text-slate-600 hover:text-slate-900'}`}
          >
            Nhập tay
          </button>
        </div>
      </div>

      {mode === 'weekly' && (
        <div className="space-y-3 pt-1">
          <div>
            <span className="text-xs font-medium text-slate-500 mb-1.5 block">Chọn các ngày trong tuần:</span>
            <div className="flex flex-wrap gap-1.5">
              {DAYS_OF_WEEK.map(d => {
                const isSelected = selectedDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggleDay(d.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-primary text-white border-primary shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {isSelected && <Check size={12} />}
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-medium text-slate-500 mb-1 block flex items-center gap-1">
                <Clock size={12} /> Từ giờ:
              </span>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 mb-1 block flex items-center gap-1">
                <Clock size={12} /> Đến giờ:
              </span>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={applyWeeklyTime}
            className="w-full py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition"
          >
            Áp dụng lịch tuần này
          </button>
        </div>
      )}

      {mode === 'specific' && (
        <div className="space-y-3 pt-1">
          <div>
            <span className="text-xs font-medium text-slate-500 mb-1 block flex items-center gap-1">
              <Calendar size={12} /> Chọn ngày:
            </span>
            <input
              type="date"
              value={specificDate}
              onChange={e => setSpecificDate(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-medium text-slate-500 mb-1 block flex items-center gap-1">
                <Clock size={12} /> Từ giờ:
              </span>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <span className="text-xs font-medium text-slate-500 mb-1 block flex items-center gap-1">
                <Clock size={12} /> Đến giờ:
              </span>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={applySpecificDate}
            className="w-full py-1.5 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900 transition"
          >
            Áp dụng ngày này
          </button>
        </div>
      )}

      {/* Result Preview Input */}
      <div className="pt-2 border-t border-slate-200/60">
        <span className="text-xs font-semibold text-slate-600 mb-1 block">Kết quả hiển thị:</span>
        <input
          type="text"
          value={manualText}
          onChange={e => {
            setManualText(e.target.value);
            onChange(e.target.value);
          }}
          placeholder="Vd: Thứ 2 - Thứ 6, 18:00 - 21:00"
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:border-primary outline-none transition"
        />
      </div>
    </div>
  );
}
