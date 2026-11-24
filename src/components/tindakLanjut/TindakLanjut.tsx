import {
  AlertTriangle,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Edit3,
  Lightbulb,
  Plus,
  Printer,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type { FormEvent } from 'react';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
  PROBLEM_CATEGORIES,
  getSmartRecommendation,
} from '../../constants/followUp';
import {
  loadStoredFollowUps,
  saveStoredFollowUps,
} from '../../services/storage';
import type {
  ActiveTab,
  AffectedTeacherItem,
  FollowUpItem,
  Guru,
  SupervisionSession,
} from '../../types/supervision';
import { exportCategoryTeachersPdf } from '../../utils/exportPdf';

const CategoryTeachersModal = lazy(() => import('./CategoryTeachersModal'));

interface TindakLanjutProps {
  gurus: Guru[];
  supervisions: SupervisionSession[];
  setActiveTab?: (tab: ActiveTab) => void;
  setSelectedSupervisiId?: (id: string | null) => void;
}

export default function TindakLanjut({
  gurus,
  supervisions,
  setActiveTab,
  setSelectedSupervisiId,
}: TindakLanjutProps) {
  const [followUps, setFollowUps] = useState<FollowUpItem[]>(() => loadStoredFollowUps());
  const [searchQuery, setSearchQuery] = useState('');
  const [impactFilter, setImpactFilter] = useState('all');
  const [problemFilter, setProblemFilter] = useState('all');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('Diferensiasi Pembelajaran');
  const [editingItem, setEditingItem] = useState<FollowUpItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isExportingCategoryPdf, setIsExportingCategoryPdf] = useState(false);

  const [formGuruNama, setFormGuruNama] = useState('');
  const [formGuruNip, setFormGuruNip] = useState('');
  const [formMapel, setFormMapel] = useState('');
  const [formKelas, setFormKelas] = useState('');
  const [formTemuan, setFormTemuan] = useState('Diferensiasi');
  const [formIntervensi, setFormIntervensi] = useState('Modul berdiferensiasi');
  const [formStatus, setFormStatus] = useState('Terealisasi');
  const [formDampak, setFormDampak] = useState('Meningkat');
  const [formSmartRekomendasi, setFormSmartRekomendasi] = useState('');
  const [formSudahRefleksi, setFormSudahRefleksi] = useState(true);
  const [formSudahTindakLanjut, setFormSudahTindakLanjut] = useState(true);
  const [formPerubahanPraktik, setFormPerubahanPraktik] = useState(true);
  const [formPerluPendampingan, setFormPerluPendampingan] = useState(false);
  const [formCatatan, setFormCatatan] = useState('');

  const persistFollowUps = (next: FollowUpItem[]) => {
    setFollowUps(next);
    saveStoredFollowUps(next);
  };

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    const existingNames = new Set(followUps.map((f) => f.guruNama.toLowerCase()));
    const syncedFromSupervisions: FollowUpItem[] = [];

    supervisions.forEach((sv) => {
      const matchedGuru = gurus.find((g) => g.id === sv.instrument.guruId);
      const guruNama = matchedGuru?.nama || sv.instrument.mapel || 'Guru';
      if (
        !existingNames.has(guruNama.toLowerCase()) &&
        (sv.status === 'Pasca-Observasi' ||
          sv.status === 'Tindak Lanjut' ||
          sv.status === 'Selesai')
      ) {
        const finding =
          sv.instrument.perbaikan || sv.instrument.praFields?.area || 'Diferensiasi';
        const intervensi =
          sv.instrument.rekomendasi || 'Pendampingan Modul Ajar Klinis';
        syncedFromSupervisions.push({
          id: `tl-sup-${sv.id}`,
          guruNama,
          guruNip: matchedGuru?.nip || sv.instrument.nipGuru || '-',
          mapel: sv.instrument.mapel || matchedGuru?.mapel || 'Mata Pelajaran',
          kelas: sv.instrument.kelas || 'X',
          temuan: finding.slice(0, 35),
          intervensi: intervensi.slice(0, 45),
          status: sv.status === 'Selesai' ? 'Terealisasi' : 'Dipantau',
          dampak: sv.status === 'Selesai' ? 'Meningkat' : 'Dipantau',
          smartRekomendasi: getSmartRecommendation(finding),
          sudahRefleksi: Boolean(sv.instrument.pascaRefleksi),
          sudahTindakLanjut: sv.status === 'Selesai' || sv.status === 'Tindak Lanjut',
          perubahanPraktik: sv.status === 'Selesai',
          perluPendampingan: sv.status !== 'Selesai',
          tglSupervisi:
            sv.instrument.tglObs || new Date().toISOString().split('T')[0],
          catatan: sv.instrument.kekuatan || 'Catatan hasil supervisi klinis.',
        });
      }
    });

    if (syncedFromSupervisions.length > 0) {
      persistFollowUps([...followUps, ...syncedFromSupervisions]);
    }
  }, [supervisions, gurus, followUps]);

  const openAddModal = () => {
    setEditingItem(null);
    setFormGuruNama(gurus[0]?.nama || 'Guru A');
    setFormGuruNip(gurus[0]?.nip || '');
    setFormMapel(gurus[0]?.mapel || 'Bahasa Indonesia');
    setFormKelas('X-1');
    setFormTemuan('Diferensiasi');
    setFormIntervensi('Modul berdiferensiasi');
    setFormStatus('Terealisasi');
    setFormDampak('Meningkat');
    setFormSmartRekomendasi(getSmartRecommendation('Diferensiasi'));
    setFormSudahRefleksi(true);
    setFormSudahTindakLanjut(true);
    setFormPerubahanPraktik(true);
    setFormPerluPendampingan(false);
    setFormCatatan('');
    setShowFormModal(true);
  };

  const openEditModal = (item: FollowUpItem) => {
    setEditingItem(item);
    setFormGuruNama(item.guruNama);
    setFormGuruNip(item.guruNip || '');
    setFormMapel(item.mapel || '');
    setFormKelas(item.kelas || '');
    setFormTemuan(item.temuan);
    setFormIntervensi(item.intervensi);
    setFormStatus(item.status);
    setFormDampak(item.dampak);
    setFormSmartRekomendasi(item.smartRekomendasi || getSmartRecommendation(item.temuan));
    setFormSudahRefleksi(item.sudahRefleksi);
    setFormSudahTindakLanjut(item.sudahTindakLanjut);
    setFormPerubahanPraktik(item.perubahanPraktik);
    setFormPerluPendampingan(item.perluPendampingan);
    setFormCatatan(item.catatan || '');
    setShowFormModal(true);
  };

  const handleSaveFollowUp = (e: FormEvent) => {
    e.preventDefault();
    if (!formGuruNama.trim()) return;

    if (editingItem) {
      const updated = followUps.map((item) =>
        item.id === editingItem.id
          ? {
              ...item,
              guruNama: formGuruNama.trim(),
              guruNip: formGuruNip.trim(),
              mapel: formMapel.trim(),
              kelas: formKelas.trim(),
              temuan: formTemuan.trim(),
              intervensi: formIntervensi.trim(),
              status: formStatus,
              dampak: formDampak,
              smartRekomendasi:
                formSmartRekomendasi || getSmartRecommendation(formTemuan),
              sudahRefleksi: formSudahRefleksi,
              sudahTindakLanjut: formSudahTindakLanjut,
              perubahanPraktik: formPerubahanPraktik,
              perluPendampingan: formPerluPendampingan,
              catatan: formCatatan.trim(),
            }
          : item,
      );
      persistFollowUps(updated);
      showToast(`Data tindak lanjut ${formGuruNama} berhasil diperbarui.`);
    } else {
      const created: FollowUpItem = {
        id: `tl-${Date.now()}`,
        guruNama: formGuruNama.trim(),
        guruNip: formGuruNip.trim(),
        mapel: formMapel.trim(),
        kelas: formKelas.trim(),
        temuan: formTemuan.trim(),
        intervensi: formIntervensi.trim(),
        status: formStatus,
        dampak: formDampak,
        smartRekomendasi:
          formSmartRekomendasi || getSmartRecommendation(formTemuan),
        sudahRefleksi: formSudahRefleksi,
        sudahTindakLanjut: formSudahTindakLanjut,
        perubahanPraktik: formPerubahanPraktik,
        perluPendampingan: formPerluPendampingan,
        tglSupervisi: new Date().toISOString().split('T')[0],
        catatan: formCatatan.trim(),
      };
      persistFollowUps([created, ...followUps]);
      showToast(`Tindak lanjut baru untuk ${formGuruNama} berhasil ditambahkan.`);
    }
    setShowFormModal(false);
  };

  const handleDeleteFollowUp = (id: string) => {
    persistFollowUps(followUps.filter((item) => item.id !== id));
    setDeleteId(null);
    showToast('Catatan tindak lanjut berhasil dihapus.');
  };

  const impactMetrics = useMemo(() => {
    const teacherNames = new Set<string>();
    gurus.forEach((g) => teacherNames.add(g.nama.toLowerCase()));
    supervisions.forEach((sv) => {
      const matched = gurus.find((g) => g.id === sv.instrument.guruId);
      if (matched) teacherNames.add(matched.nama.toLowerCase());
    });
    followUps.forEach((item) => teacherNames.add(item.guruNama.toLowerCase()));

    const totalDisupervisi = Math.max(teacherNames.size, followUps.length);
    const sudahRefleksi = followUps.filter((item) => item.sudahRefleksi).length;
    const sudahTindakLanjut = followUps.filter((item) => item.sudahTindakLanjut).length;
    const perubahanPraktik = followUps.filter(
      (item) => item.dampak === 'Meningkat' || item.perubahanPraktik,
    ).length;
    const perluPendampingan = followUps.filter(
      (item) =>
        item.dampak === 'Dipantau' ||
        item.dampak === 'Perlu Pendampingan' ||
        item.perluPendampingan,
    ).length;

    return {
      totalDisupervisi,
      sudahRefleksi,
      sudahTindakLanjut,
      perubahanPraktik,
      perluPendampingan,
      rateRefleksi:
        totalDisupervisi > 0
          ? Math.round((sudahRefleksi / totalDisupervisi) * 100)
          : 0,
      rateTindakLanjut:
        totalDisupervisi > 0
          ? Math.round((sudahTindakLanjut / totalDisupervisi) * 100)
          : 0,
      rateDampak:
        totalDisupervisi > 0
          ? Math.round((perubahanPraktik / totalDisupervisi) * 100)
          : 0,
    };
  }, [followUps, gurus, supervisions]);

  const categoryMap = useMemo(() => {
    const result: Record<string, AffectedTeacherItem[]> = {};

    PROBLEM_CATEGORIES.forEach((cat) => {
      const items: AffectedTeacherItem[] = [];
      const seenNames = new Set<string>();

      followUps.forEach((tl) => {
        const haystack =
          `${tl.temuan} ${tl.catatan || ''} ${tl.intervensi || ''}`.toLowerCase();
        if (
          haystack.includes(cat.name.toLowerCase()) ||
          haystack.includes(cat.shortName.toLowerCase()) ||
          cat.keywords.some((kw) => haystack.includes(kw))
        ) {
          const normName = (tl.guruNama || '').toLowerCase().trim();
          seenNames.add(normName);
          const matchedGuru = gurus.find(
            (g) =>
              g.nama.toLowerCase().trim() === normName ||
              (tl.guruNip && g.nip === tl.guruNip),
          );
          const matchedSv = supervisions.find(
            (sv) =>
              (matchedGuru && sv.instrument.guruId === matchedGuru.id) ||
              sv.instrument.namaGuru?.toLowerCase().trim() === normName,
          );
          items.push({
            id: `aff-tl-${tl.id}`,
            guruId: matchedGuru?.id,
            guruNama: tl.guruNama,
            guruNip: tl.guruNip || matchedGuru?.nip || '-',
            mapel: tl.mapel || matchedGuru?.mapel || '-',
            kelas: tl.kelas || '-',
            source: 'tindak_lanjut',
            categoryName: cat.name,
            detailMasalah:
              tl.temuan + (tl.catatan ? `: "${tl.catatan}"` : ''),
            intervensi: tl.intervensi,
            status: tl.status,
            dampak: tl.dampak,
            smartRekomendasi:
              tl.smartRekomendasi || getSmartRecommendation(cat.name),
            supervisiId: matchedSv?.id,
            tglSupervisi: tl.tglSupervisi,
            tindakLanjutItem: tl,
          });
        }
      });

      supervisions.forEach((sv) => {
        const matchedGuru = gurus.find((g) => g.id === sv.instrument.guruId);
        const teacherName =
          sv.instrument.namaGuru || matchedGuru?.nama || 'Guru';
        const normName = teacherName.toLowerCase().trim();
        if (seenNames.has(normName)) return;

        const fallbackGuru =
          matchedGuru ||
          gurus.find((g) => g.nama.toLowerCase().trim() === normName);

        let lowScoreLabel = '';
        if (sv.instrument.obsScores) {
          for (const rId of cat.rubricIds) {
            const val = sv.instrument.obsScores[rId];
            if (typeof val === 'number' && val > 0 && val <= 2.5) {
              lowScoreLabel = `Skor rubrik ${val}/4.0 (Perlu Peningkatan)`;
              break;
            }
          }
        }

        const svText =
          `${sv.instrument.perbaikan || ''} ${sv.instrument.praFields?.area || ''} ${sv.instrument.rekomendasi || ''} ${sv.instrument.kekuatan || ''}`.toLowerCase();
        const matchesKeyword = cat.keywords.some((kw) => svText.includes(kw));

        if (lowScoreLabel || matchesKeyword) {
          seenNames.add(normName);
          const detailMasalah = lowScoreLabel
            ? `${lowScoreLabel}. ${sv.instrument.perbaikan || 'Memerlukan pembinaan klinis'}`
            : sv.instrument.perbaikan ||
              sv.instrument.praFields?.area ||
              `Temuan observasi terkait ${cat.shortName}`;
          items.push({
            id: `aff-sup-${sv.id}`,
            guruId: fallbackGuru?.id || sv.instrument.guruId,
            guruNama: teacherName,
            guruNip: fallbackGuru?.nip || sv.instrument.nipGuru || '-',
            mapel: fallbackGuru?.mapel || sv.instrument.mapel || '-',
            kelas: sv.instrument.kelas || '-',
            source: 'supervisi',
            categoryName: cat.name,
            detailMasalah,
            intervensi: sv.instrument.rekomendasi || cat.defaultIntervensi,
            skorRubrik: lowScoreLabel || undefined,
            status:
              sv.status === 'Selesai' ? 'Terealisasi' : 'Belum Ditindaklanjuti',
            dampak:
              sv.status === 'Selesai' ? 'Meningkat' : 'Perlu Pendampingan',
            smartRekomendasi: getSmartRecommendation(cat.name),
            supervisiId: sv.id,
            tglSupervisi:
              sv.instrument.tglObs || sv.createdAt?.split('T')[0],
          });
        }
      });

      result[cat.name] = items;
    });

    return result;
  }, [followUps, supervisions, gurus]);

  const problemStats = useMemo(() => {
    let totalCount = 0;
    const raw = PROBLEM_CATEGORIES.map((cat) => {
      const teachers = categoryMap[cat.name] || [];
      const count = teachers.length;
      totalCount += count;
      return {
        name: cat.name,
        shortName: cat.shortName,
        count,
        teachers,
        solusiIHT: cat.solusiIHT,
        defaultIntervensi: cat.defaultIntervensi,
      };
    });

    const denominator = totalCount > 0 ? totalCount : 1;
    const distribution = raw
      .map((item) => ({
        ...item,
        percentage:
          totalCount > 0 ? Math.round((item.count / denominator) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    return {
      distribution,
      topProblem: distribution[0],
      totalCount,
    };
  }, [categoryMap]);

  const selectedCategoryTeachers = useMemo(
    () => categoryMap[selectedCategory] || [],
    [categoryMap, selectedCategory],
  );

  const openCategoryModal = (catName: string) => {
    setSelectedCategory(catName);
    setShowCategoryModal(true);
  };

  const handleAssignTeacherForCategory = (catName: string, teacher?: Guru | null) => {
    setShowCategoryModal(false);
    setEditingItem(null);
    const cat = PROBLEM_CATEGORIES.find((c) => c.name === catName);
    const targetGuru = teacher || (gurus.length > 0 ? gurus[0] : null);
    setFormGuruNama(targetGuru?.nama || 'Guru');
    setFormGuruNip(targetGuru?.nip || '');
    setFormMapel(targetGuru?.mapel || '');
    setFormKelas('X');
    setFormTemuan(cat?.shortName || catName);
    setFormIntervensi(cat?.defaultIntervensi || 'Pendampingan Modul Ajar');
    setFormStatus('Sedang Berjalan');
    setFormDampak('Dipantau');
    setFormSmartRekomendasi(getSmartRecommendation(catName));
    setFormSudahRefleksi(false);
    setFormSudahTindakLanjut(false);
    setFormPerubahanPraktik(false);
    setFormPerluPendampingan(true);
    setFormCatatan(`Fokus pendampingan klinis pada aspek: ${catName}.`);
    setShowFormModal(true);
  };

  const handleOpenSupervisiFromModal = (supervisiId?: string, guruId?: string) => {
    setShowCategoryModal(false);
    if (supervisiId && setSelectedSupervisiId) {
      setSelectedSupervisiId(supervisiId);
      setActiveTab?.('laporan');
    } else if (guruId && setSelectedSupervisiId) {
      const found = supervisions.find((sv) => sv.instrument.guruId === guruId);
      if (found) {
        setSelectedSupervisiId(found.id);
        setActiveTab?.('laporan');
      } else {
        setActiveTab?.('instrumen');
      }
    } else {
      setActiveTab?.('instrumen');
    }
  };

  const handleFollowUpTeacher = (teacher: AffectedTeacherItem) => {
    setShowCategoryModal(false);
    if (teacher.tindakLanjutItem) {
      openEditModal(teacher.tindakLanjutItem);
    } else {
      const matched = gurus.find(
        (g) => g.id === teacher.guruId || g.nama === teacher.guruNama,
      );
      handleAssignTeacherForCategory(teacher.categoryName, matched || null);
    }
  };

  const handleExportCategoryPdf = async () => {
    setIsExportingCategoryPdf(true);
    try {
      const catDef = PROBLEM_CATEGORIES.find((c) => c.name === selectedCategory);
      const ok = await exportCategoryTeachersPdf({
        categoryName: selectedCategory,
        teachers: selectedCategoryTeachers,
        solusiIHT: catDef?.solusiIHT,
        totalTeachersCount: gurus.length,
      });
      showToast(
        ok
          ? `Dokumen PDF Daftar Guru (${selectedCategory}) berhasil diunduh.`
          : 'Gagal memproses dokumen PDF. Silakan coba kembali.',
      );
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('Terjadi kendala teknis saat membuat dokumen PDF.');
    } finally {
      setIsExportingCategoryPdf(false);
    }
  };

  const filteredFollowUps = useMemo(
    () =>
      followUps.filter((item) => {
        const matchesSearch =
          item.guruNama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.temuan.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.intervensi.toLowerCase().includes(searchQuery.toLowerCase()) ||
          Boolean(item.mapel?.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesImpact = impactFilter === 'all' || item.dampak === impactFilter;
        const matchesProblem =
          problemFilter === 'all' ||
          item.temuan.toLowerCase().includes(problemFilter.toLowerCase());
        return matchesSearch && matchesImpact && matchesProblem;
      }),
    [followUps, searchQuery, impactFilter, problemFilter],
  );

  return (
    <div className="space-y-8 pb-12">
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="fixed top-20 right-8 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xl border border-emerald-600 no-print"
          >
            <CheckCircle2 size={16} />
            <span>{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-md bg-brand-100 text-brand-800 text-[11px] font-extrabold uppercase tracking-wider">
              TINDAK LANJUT SUPERVISI
            </span>
            <span className="text-xs text-gray-400 font-medium">
              • Siklus Pembinaan Pasca Observasi
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-gray-900 tracking-tight">
            Tindak Lanjut Supervisi &amp; Dashboard Mutu
          </h2>
          <p className="text-sm text-gray-500 max-w-3xl mt-1">
            Pemantauan realisasi rencana intervensi guru, rekomendasi cerdas otomatis berbasis
            temuan kelas, serta analisis dampak terhadap peningkatan mutu pembelajaran.
          </p>
        </div>

        <div className="flex items-center gap-3 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
            title="Cetak Rekap Tindak Lanjut"
          >
            <Printer size={15} />
            <span>Cetak / PDF</span>
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md shadow-brand-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Plus size={16} />
            <span>Tambah Tindak Lanjut</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-brand-950 to-indigo-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-brand-300 ring-1 ring-white/20">
              <TrendingUp size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-display font-bold tracking-tight text-white uppercase">
                  SUPERVISION IMPACT DASHBOARD
                </h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[10px] font-bold tracking-widest uppercase">
                  Live Mutu
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                Indikator Mutu Realisasi Pasca-Supervisi Klinis &amp; Transformasi Praktik
                Pedagogik di Kelas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
            <Award size={15} className="text-amber-400" />
            <span>
              Efektivitas Dampak:{' '}
              <strong className="text-emerald-400 font-bold">{impactMetrics.rateDampak}%</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 p-2 sm:p-0">
          <div className="p-5 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Guru Disupervisi
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={14} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-gray-900">
                  {impactMetrics.totalDisupervisi}
                </span>
                <span className="text-xs font-semibold text-gray-400">Guru</span>
              </div>
              <p className="text-[11px] text-gray-500 mt-1">Total sasaran supervisi</p>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Sudah Refleksi
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={14} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-emerald-700">
                  {impactMetrics.sudahRefleksi}
                </span>
                <span className="text-xs font-semibold text-gray-400">Guru</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-medium mt-1">
                {impactMetrics.rateRefleksi}% pasca-observasi tuntas
              </p>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between hover:bg-slate-50/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                Sudah Tindak Lanjut
              </span>
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <ClipboardCheck size={14} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-indigo-700">
                  {impactMetrics.sudahTindakLanjut}
                </span>
                <span className="text-xs font-semibold text-gray-400">Guru</span>
              </div>
              <p className="text-[11px] text-indigo-700 font-medium mt-1">
                {impactMetrics.rateTindakLanjut}% intervensi terlaksana
              </p>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between bg-emerald-50/30 hover:bg-emerald-50/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Perubahan Praktik
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <TrendingUp size={14} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-emerald-800">
                  {impactMetrics.perubahanPraktik}
                </span>
                <span className="text-xs font-semibold text-emerald-600">Guru</span>
              </div>
              <p className="text-[11px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                <span>🟢</span>
                <span>Meningkat signifikan</span>
              </p>
            </div>
          </div>

          <div className="p-5 flex flex-col justify-between bg-amber-50/30 hover:bg-amber-50/50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
                Perlu Pendampingan
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                <AlertTriangle size={14} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-display font-extrabold text-amber-800">
                  {impactMetrics.perluPendampingan}
                </span>
                <span className="text-xs font-semibold text-amber-600">Guru</span>
              </div>
              <p className="text-[11px] text-amber-700 font-bold mt-1 flex items-center gap-1">
                <span>🟡</span>
                <span>Dipantau &amp; coaching</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
          <div>
            <div className="flex items-center gap-2 text-brand-600 mb-1">
              <BarChart3 size={18} />
              <span className="text-xs font-bold uppercase tracking-wider">
                Pemetaan Kebutuhan Guru
              </span>
            </div>
            <h3 className="text-lg lg:text-xl font-display font-bold text-gray-900">
              Peta Masalah Pembelajaran: Apa masalah pembelajaran yang paling banyak ditemukan di
              sekolah?
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Distribusi temuan pedagogik dari hasil instrumen observasi kelas untuk merumuskan
              intervensi kolektif KKG/MGMP.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500">Filter Temuan:</span>
            <select
              value={problemFilter}
              onChange={(e) => setProblemFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">Semua Kategori</option>
              {problemStats.distribution.map((cat) => (
                <option key={cat.name} value={cat.name}>
                  {cat.name} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <div className="lg:col-span-2 space-y-4">
            {problemStats.distribution.map((cat, idx) => {
              const isTop = idx === 0;
              const isActive =
                problemFilter !== 'all' &&
                cat.name.toLowerCase().includes(problemFilter.toLowerCase());
              const barPct = Math.max(cat.percentage, cat.count > 0 ? 8 : 4);

              return (
                <div
                  key={cat.name}
                  onClick={() => {
                    setProblemFilter(cat.name);
                    openCategoryModal(cat.name);
                  }}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${
                    isActive
                      ? 'bg-brand-50/70 border-brand-300 ring-2 ring-brand-500/20'
                      : 'bg-gray-50/60 hover:bg-gray-100/80 border-gray-100 hover:border-gray-200'
                  }`}
                  title={`Klik untuk melihat guru dengan masalah ${cat.name}`}
                >
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          isTop
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-gray-800">{cat.name}</span>
                      {isTop && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-extrabold text-[9px] rounded-full uppercase">
                          Terbanyak Ditemukan
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-700">{cat.count} Guru</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCategoryModal(cat.name);
                        }}
                        className="opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity text-[11px] font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded flex items-center gap-1 cursor-pointer"
                        title="Lihat daftar guru dengan masalah ini"
                      >
                        Lihat Guru <ChevronRight size={11} />
                      </button>
                      <span className="text-xs font-extrabold text-brand-600 min-w-[36px] text-right">
                        {cat.percentage}%
                      </span>
                    </div>
                  </div>

                  <svg
                    viewBox="0 0 100 8"
                    preserveAspectRatio="none"
                    className="w-full h-2.5 rounded-full overflow-hidden bg-gray-200"
                    aria-label={`${cat.name}: ${cat.percentage}%`}
                  >
                    <defs>
                      <linearGradient id={`barGrad-${idx}`} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                    <rect
                      x="0"
                      y="0"
                      width={barPct}
                      height="8"
                      rx="4"
                      fill={isTop ? `url(#barGrad-${idx})` : undefined}
                      className={isTop ? '' : 'fill-brand-600'}
                    />
                  </svg>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-br from-amber-50/80 to-amber-100/50 border border-amber-200/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-amber-900">
              <Lightbulb size={20} className="text-amber-600 flex-shrink-0" />
              <h4 className="font-bold text-sm">Rekomendasi Kebijakan Sekolah</h4>
            </div>

            <p className="text-xs text-amber-950 leading-relaxed">
              Berdasarkan pemetaan, temuan terbanyak saat ini adalah{' '}
              <strong className="text-rose-700 font-extrabold underline underline-offset-2">
                &quot;{problemStats.topProblem?.name || 'Diferensiasi Pembelajaran'}&quot;
              </strong>{' '}
              ({problemStats.topProblem?.percentage || 0}% temuan supervisi).
            </p>

            <div className="bg-white/80 backdrop-blur-xs p-3.5 rounded-xl border border-amber-200 text-xs text-gray-700 space-y-2">
              <p className="font-bold text-gray-900 flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-600" />
                <span>Rencana Aksi Strategis Sekolah:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-600">
                <li>
                  Mengagendakan <strong>In-House Training (IHT)</strong> modul ajar berdiferensiasi
                  dan asesmen diagnostik.
                </li>
                <li>
                  Membentuk <strong>Peer Coaching</strong> antar-guru serumpun mapel di Komunitas
                  Belajar (Kombel).
                </li>
                <li>
                  Melakukan supervisi klinis siklus kedua dengan fokus pendampingan rubrik
                  implementasi kelas.
                </li>
              </ul>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() =>
                  openCategoryModal(
                    problemStats.topProblem?.name || 'Diferensiasi Pembelajaran',
                  )
                }
                className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20"
                title="Buka daftar guru dengan kendala ini"
              >
                <span>Lihat Guru dengan Masalah Ini</span>
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden space-y-4">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-bold text-lg text-gray-900">
              Daftar Realisasi Intervensi &amp; Rekomendasi Klinis
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Menampilkan {filteredFollowUps.length} dari total {followUps.length} catatan tindak
              lanjut guru.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />
              <input
                type="text"
                placeholder="Cari guru, temuan, intervensi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center bg-gray-50 p-1 border border-gray-200 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setImpactFilter('all')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  impactFilter === 'all'
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setImpactFilter('Meningkat')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  impactFilter === 'Meningkat'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-emerald-700 hover:text-emerald-800'
                }`}
              >
                🟢 Meningkat
              </button>
              <button
                type="button"
                onClick={() => setImpactFilter('Dipantau')}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  impactFilter === 'Dipantau'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-700 hover:text-amber-800'
                }`}
              >
                🟡 Dipantau
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-6">Guru</th>
                <th className="py-3.5 px-6">Temuan Masalah</th>
                <th className="py-3.5 px-6">Intervensi</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Dampak</th>
                <th className="py-3.5 px-6">Smart Rekomendasi Tindak Lanjut</th>
                <th className="py-3.5 px-6 text-right no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
              {filteredFollowUps.map((item) => {
                const isMeningkat = item.dampak === 'Meningkat';
                const isDipantau = item.dampak === 'Dipantau';

                return (
                  <tr key={item.id} className="hover:bg-gray-50/60 transition-colors group">
                    <td className="py-4 px-6 align-top">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isMeningkat
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-brand-100 text-brand-800'
                          }`}
                        >
                          {item.guruNama ? item.guruNama.slice(0, 2).toUpperCase() : 'G'}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{item.guruNama}</p>
                          <p className="text-[11px] text-gray-500">
                            {item.mapel || 'Mapel Belum Diisi'} {item.kelas ? `• ${item.kelas}` : ''}
                          </p>
                          {item.guruNip && (
                            <p className="text-[10px] text-gray-400 font-mono">
                              NIP. {item.guruNip}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-6 align-top">
                      <div className="space-y-1">
                        <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 border border-slate-200 rounded-md text-xs font-bold">
                          {item.temuan}
                        </span>
                        {item.catatan && (
                          <p className="text-[11px] text-gray-500 italic line-clamp-2 max-w-[220px]">
                            &quot;{item.catatan}&quot;
                          </p>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 align-top">
                      <div className="space-y-1">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-brand-50 text-brand-700 border border-brand-200/60 rounded-md font-bold text-xs">
                          {item.intervensi}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          {item.sudahRefleksi && <span>✓ Refleksi</span>}
                          {item.sudahTindakLanjut && <span>✓ Tindak Lanjut</span>}
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 align-top text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          item.status === 'Terealisasi'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : item.status === 'Dipantau'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>

                    <td className="py-4 px-4 align-top text-center">
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${
                          isMeningkat
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : isDipantau
                              ? 'bg-amber-50 border-amber-200 text-amber-800'
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}
                      >
                        <span>{isMeningkat ? '🟢' : isDipantau ? '🟡' : '🔴'}</span>
                        <span>{item.dampak}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6 align-top max-w-sm">
                      <div className="bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-3 rounded-xl border border-indigo-100 text-[11px] text-gray-700 space-y-1">
                        <div className="flex items-center gap-1.5 text-indigo-700 font-bold">
                          <Sparkles size={13} className="text-indigo-600 flex-shrink-0" />
                          <span>Smart Rekomendasi Sistem:</span>
                        </div>
                        <p className="leading-relaxed text-gray-600">
                          {item.smartRekomendasi || getSmartRecommendation(item.temuan)}
                        </p>
                      </div>
                    </td>

                    <td className="py-4 px-6 align-top text-right no-print">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-gray-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Catatan Tindak Lanjut"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteId(item.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Catatan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredFollowUps.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-gray-400">
                    <Users size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="font-semibold text-sm text-gray-500">
                      Tidak ada data tindak lanjut yang cocok dengan filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setImpactFilter('all');
                        setProblemFilter('all');
                      }}
                      className="mt-2 text-xs text-brand-600 underline font-bold cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs overflow-y-auto no-print">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl border border-gray-100 relative my-8"
          >
            <button
              type="button"
              onClick={() => setShowFormModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center">
                <ClipboardCheck size={22} />
              </div>
              <div>
                <h3 className="text-lg font-display font-bold text-gray-900">
                  {editingItem ? 'Edit Tindak Lanjut Supervisi' : 'Tambah Catatan Tindak Lanjut'}
                </h3>
                <p className="text-xs text-gray-500">
                  Catat hasil temuan, intervensi pedagogik, serta dapatkan smart rekomendasi sistem.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveFollowUp} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Nama Guru <span className="text-rose-500">*</span>
                  </label>
                  {gurus.length > 0 ? (
                    <div className="space-y-1.5">
                      <select
                        value={formGuruNama}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormGuruNama(val);
                          const found = gurus.find((g) => g.nama === val);
                          if (found) {
                            setFormGuruNip(found.nip || '');
                            setFormMapel(found.mapel || '');
                          }
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      >
                        {gurus.map((g) => (
                          <option key={g.id} value={g.nama}>
                            {g.nama} ({g.mapel})
                          </option>
                        ))}
                        <option value="Guru A">Guru A</option>
                        <option value="Guru B">Guru B</option>
                        <option value="Guru C">Guru C</option>
                        <option value="Lainnya">Nama Lainnya / Manual</option>
                      </select>
                      {formGuruNama === 'Lainnya' && (
                        <input
                          type="text"
                          placeholder="Masukkan nama guru..."
                          onChange={(e) => setFormGuruNama(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs"
                          required
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={formGuruNama}
                      onChange={(e) => setFormGuruNama(e.target.value)}
                      placeholder="Contoh: Guru A atau Budi Santoso, S.Pd"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                      required
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Mata Pelajaran &amp; Kelas
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Mapel"
                      value={formMapel}
                      onChange={(e) => setFormMapel(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Kelas (e.g. X-1)"
                      value={formKelas}
                      onChange={(e) => setFormKelas(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Temuan Masalah Pembelajaran <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formTemuan}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormTemuan(val);
                      setFormSmartRekomendasi(getSmartRecommendation(val));
                    }}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Diferensiasi">
                      Diferensiasi (Modul, Kesiapan Belajar)
                    </option>
                    <option value="Keaktifan siswa">
                      Keaktifan siswa (Partisipasi, Dialog)
                    </option>
                    <option value="Asesmen formatif">
                      Asesmen formatif (Exit Ticket, Feedback)
                    </option>
                    <option value="Pemanfaatan Teknologi">
                      Pemanfaatan Teknologi &amp; Media
                    </option>
                    <option value="Manajemen Kelas">
                      Manajemen Kelas &amp; Disiplin Positif
                    </option>
                    <option value="Literasi & Numerasi">Literasi &amp; Numerasi Mendalam</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Bentuk Intervensi Tindak Lanjut <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formIntervensi}
                    onChange={(e) => setFormIntervensi(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Modul berdiferensiasi">Modul berdiferensiasi</option>
                    <option value="PBL">PBL (Problem Based Learning)</option>
                    <option value="Exit ticket">Exit ticket (Asesmen Cepat)</option>
                    <option value="PjBL (Project Based Learning)">
                      PjBL (Project Based Learning)
                    </option>
                    <option value="Peer Coaching MGMP">Peer Coaching MGMP</option>
                    <option value="Workshop Pembelajaran Mendalam">
                      Workshop Pembelajaran Mendalam
                    </option>
                    <option value="Segitiga Restitusi Kelas">Segitiga Restitusi Kelas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Status Pelaksanaan
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="Terealisasi">Terealisasi (Selesai)</option>
                    <option value="Dipantau">Dipantau (Sedang Berjalan)</option>
                    <option value="Sedang Berjalan">Sedang Berjalan</option>
                    <option value="Belum Dimulai">Belum Dimulai</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Dampak Perubahan Pembelajaran <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormDampak('Meningkat')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        formDampak === 'Meningkat'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20 shadow-xs'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span>🟢</span>
                      <span>Meningkat</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormDampak('Dipantau')}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        formDampak === 'Dipantau'
                          ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-500/20 shadow-xs'
                          : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span>🟡</span>
                      <span>Dipantau</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-gradient-to-br from-indigo-50/70 to-purple-50/50 rounded-xl border border-indigo-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-800">
                    <Sparkles size={15} className="text-indigo-600" />
                    <span>Smart Rekomendasi (Otomatis Berdasarkan Temuan)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormSmartRekomendasi(getSmartRecommendation(formTemuan))}
                    className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Generate Ulang</span>
                  </button>
                </div>
                <textarea
                  value={formSmartRekomendasi}
                  onChange={(e) => setFormSmartRekomendasi(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-white border border-indigo-200 rounded-lg text-xs text-gray-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Sistem otomatis menghasilkan rekomendasi tindak lanjut..."
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-gray-100">
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSudahRefleksi}
                    onChange={(e) => setFormSudahRefleksi(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Sudah Refleksi</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSudahTindakLanjut}
                    onChange={(e) => setFormSudahTindakLanjut(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Sudah Tindak Lanjut</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPerubahanPraktik}
                    onChange={(e) => setFormPerubahanPraktik(e.target.checked)}
                    className="rounded text-brand-600 focus:ring-brand-500"
                  />
                  <span>Praktik Berubah</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formPerluPendampingan}
                    onChange={(e) => setFormPerluPendampingan(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500"
                  />
                  <span>Perlu Pendampingan</span>
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Catatan Kemajuan / Catatan Khusus
                </label>
                <textarea
                  value={formCatatan}
                  onChange={(e) => setFormCatatan(e.target.value)}
                  rows={2}
                  placeholder="Catatan perkembangan nyata di kelas, umpan balik siswa, dll..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-md shadow-brand-600/20 transition-all cursor-pointer"
                >
                  Simpan Catatan
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-xs no-print">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="font-bold text-gray-900 text-base">Hapus Catatan Ini?</h4>
              <p className="text-xs text-gray-500 mt-1">
                Data catatan tindak lanjut guru akan dihapus dari dashboard.
              </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => handleDeleteFollowUp(deleteId)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      <Suspense fallback={null}>
        <AnimatePresence>
          {showCategoryModal && (
            <CategoryTeachersModal
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              categoryMap={categoryMap}
              teachers={selectedCategoryTeachers}
              isExportingPdf={isExportingCategoryPdf}
              onExportPdf={handleExportCategoryPdf}
              onClose={() => setShowCategoryModal(false)}
              onAssignTeacher={(catName) => handleAssignTeacherForCategory(catName, null)}
              onOpenSupervisi={handleOpenSupervisiFromModal}
              onFollowUpTeacher={handleFollowUpTeacher}
            />
          )}
        </AnimatePresence>
      </Suspense>
    </div>
  );
}
