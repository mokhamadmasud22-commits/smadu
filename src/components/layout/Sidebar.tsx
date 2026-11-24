import {
  BookOpen,
  CalendarCheck,
  CheckSquare,
  ClipboardList,
  LayoutDashboard,
  Printer,
  School,
  Settings,
  TrendingUp,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import type { ComponentType } from 'react';
import { useSchoolConfig } from '../../hooks/useSchoolConfig';
import type { ActiveTab } from '../../types/supervision';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: ComponentType<{ size?: number; className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'data-guru', label: 'Data Guru', icon: Users },
  { id: 'dokumen-perangkat', label: 'Dokumen Perangkat', icon: BookOpen },
  { id: 'program', label: 'Program Supervisi', icon: ClipboardList },
  { id: 'instrumen', label: 'Instrumen Supervisi', icon: CheckSquare },
  { id: 'laporan', label: 'Laporan Hasil', icon: Printer },
  { id: 'tindak-lanjut', label: 'Tindak Lanjut Supervisi', icon: TrendingUp },
  { id: 'pengaturan-sekolah', label: 'Pengaturan Sekolah', icon: School },
];

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const { config } = useSchoolConfig();

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col no-print h-screen sticky top-0 shrink-0">
      <div className="p-6 border-b border-gray-50 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
            <CalendarCheck size={24} />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl leading-tight">SI PERAK</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold italic">
              Academic Supervision
            </p>
          </div>
        </div>

        <div className="px-3 py-1.5 bg-gray-50 border border-gray-100 rounded-lg">
          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5">
            Tahun Akademik
          </p>
          <p className="text-xs font-bold text-brand-700">
            {config.academicYear.replace('/', ' / ')}
          </p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer ${
                isActive
                  ? 'bg-brand-50 text-brand-700 font-medium'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                size={20}
                className={
                  isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'
                }
              />
              <span className="text-sm text-left">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="ml-auto w-1.5 h-1.5 bg-brand-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 bg-gradient-to-b from-gray-50/60 to-gray-100/90">
        <div className="bg-white rounded-xl p-3 border border-gray-200 shadow-xs space-y-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-600 to-indigo-700 text-white flex items-center justify-center font-black text-xs shadow-md shadow-brand-500/20 shrink-0">
              AFC
            </div>
            <div className="overflow-hidden min-w-0">
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[8.5px] font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                  HAK CIPTA RESMI
                </span>
              </div>
              <p
                className="text-xs font-bold text-gray-900 truncate leading-snug"
                title="Anis Fatul Cholis, M.Pd"
              >
                Anis Fatul Cholis, M.Pd
              </p>
              <p
                className="text-[10px] text-gray-500 leading-tight line-clamp-2"
                title={
                  config.isDinasPendidikan
                    ? 'Pengawas Dinas Pendidikan Kabupaten Bojonegoro'
                    : 'Pengawas SMA Cabang Dinas Pendidikan Wilayah Bojonegoro'
                }
              >
                {config.isDinasPendidikan
                  ? 'Pengawas Disdik Kab. Bojonegoro'
                  : 'Pengawas SMA Cabdindik Wil. Bojonegoro'}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-600 leading-tight space-y-1">
            <p className="font-semibold text-brand-700 flex items-center gap-1">
              <span>© Hak Cipta Dilindungi UU</span>
            </p>
            <p className="text-[9.5px] text-gray-400 italic">
              {config.isDinasPendidikan
                ? 'Karya orisinal & instrumen supervisi klinis Disdik Bojonegoro.'
                : 'Karya orisinal & instrumen supervisi klinis resmi Cabdindik Bojonegoro.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('pengaturan-sekolah')}
            className="w-full py-1.5 px-2 text-[10px] font-bold text-gray-600 hover:text-brand-700 flex items-center justify-center gap-1.5 bg-gray-50 hover:bg-brand-50 border border-gray-200 rounded-lg hover:border-brand-200 transition-colors cursor-pointer"
          >
            <Settings size={12} />
            <span>PENGATURAN & HAK CIPTA</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
