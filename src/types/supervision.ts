export type ActiveTab =
  | 'dashboard'
  | 'data-guru'
  | 'dokumen-perangkat'
  | 'program'
  | 'instrumen'
  | 'laporan'
  | 'tindak-lanjut'
  | 'pengaturan-sekolah';

export type SchoolLevel = 'TK' | 'SD' | 'SMP' | 'SMA' | 'SMK' | 'PKPLK';

export type TeacherEmploymentStatus = 'ASN' | 'P3K' | 'GTT' | 'Guru Yayasan' | string;

export type SupervisionStatus =
  | 'Direncakan'
  | 'Pra-Observasi'
  | 'Observasi'
  | 'Pasca-Observasi'
  | 'Tindak Lanjut'
  | 'Selesai';

export interface Guru {
  id: string;
  nama: string;
  nip: string;
  pangkat: string;
  mapel: string;
  jenjang?: SchoolLevel | string;
  status: TeacherEmploymentStatus;
  kelas?: string;
}

export interface PraObservationFields {
  tujuan: string;
  area: string;
  strategi: string;
  media: string;
}

export interface RtlPlan {
  coaching: boolean;
  mentoring: boolean;
  workshop: boolean;
  lessonStudy: boolean;
  selfDevelopment: boolean;
}

export interface SupervisionPhoto {
  id: string;
  url: string;
  caption?: string;
}

export interface SupervisionDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  stage: 'modul' | 'pra' | 'observasi' | string;
}

export interface SupervisionInstrument {
  guruId: string;
  namaGuru?: string;
  nipGuru: string;
  namaSekolah?: string;
  alamatSekolah?: string;
  namaSupervisor?: string;
  nipSupervisor?: string;
  namaKepala: string;
  nipKepala: string;
  namaPengawas: string;
  nipPengawas: string;
  mapel: string;
  kelas: string;
  materi: string;
  tglPra: string;
  tglObs: string;
  tglPasca: string;
  praFields: PraObservationFields;
  praAI: string;
  obsScores: Record<string, number>;
  obsNotes: Record<string, string>;
  obsAI: string;
  pascaRefleksi: string;
  pascaSanggah: string;
  pascaRencana: string;
  pascaAI: string;
  rtl: RtlPlan;
  analysisScore: string;
  kekuatan: string;
  perbaikan: string;
  rekomendasi: string;
  photos: SupervisionPhoto[];
  documents: SupervisionDocument[];
}

export interface SupervisionSession {
  id: string;
  status: SupervisionStatus | string;
  createdAt: string;
  instrument: SupervisionInstrument;
}

export interface ImportedScheduleRow {
  namaGuru: string;
  nipGuru: string;
  mapel: string;
  kelas: string;
  materi: string;
  tglPra: string;
  tglObs: string;
  tglPasca: string;
  status: string;
}

export interface RubricItem {
  id: string;
  label: string;
  desc: string;
}

export interface RubricSection {
  id: string;
  title: string;
  items: RubricItem[];
}

export interface RubricPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  sections: RubricSection[];
}

export interface FollowUpItem {
  id: string;
  guruNama: string;
  guruNip?: string;
  mapel?: string;
  kelas?: string;
  temuan: string;
  intervensi: string;
  status: string;
  dampak: string;
  smartRekomendasi?: string;
  sudahRefleksi: boolean;
  sudahTindakLanjut: boolean;
  perubahanPraktik: boolean;
  perluPendampingan: boolean;
  tglSupervisi?: string;
  catatan?: string;
}

export interface AffectedTeacherItem {
  id: string;
  guruId?: string;
  guruNama: string;
  guruNip?: string;
  mapel: string;
  kelas?: string;
  source: 'tindak_lanjut' | 'supervisi';
  categoryName: string;
  detailMasalah: string;
  intervensi: string;
  skorRubrik?: string;
  status: string;
  dampak: string;
  smartRekomendasi: string;
  supervisiId?: string;
  tglSupervisi?: string;
  tindakLanjutItem?: FollowUpItem;
}

export interface ProblemCategoryDefinition {
  name: string;
  shortName: string;
  rubricIds: string[];
  keywords: string[];
  defaultIntervensi: string;
  solusiIHT: string;
}

export type ProgramTemplateId =
  | 'klinis-standar'
  | 'deep-learning'
  | 'diferensiasi'
  | 'matriks-rpa';

export interface ProgramTemplateConfig {
  templateId: ProgramTemplateId;
  fokusProgram: string;
  semester: string;
  targetCapaian: string;
  waktuPelaksanaan: string;
  catatanPengawas: string;
}

export interface UploadedProgramFile {
  id: string;
  name: string;
  size: number;
  type: string;
  extension: string;
  dataUrl: string;
  uploadedAt: string;
}

export interface SchoolConfig {
  schoolName: string;
  schoolLevel: SchoolLevel | string;
  kopAuthority: string;
  isDinasPendidikan: boolean;
  authorityName: string;
  authorityShort: string;
  parentGov: string;
  parentGovUpper: string;
  schoolNpsn: string;
  schoolAddress: string;
  academicYear: string;
  headmasterName: string;
  headmasterNip: string;
  internalSupervisorName: string;
  internalSupervisorNip: string;
  supervisorName: string;
  supervisorNip: string;
  supervisorRole: string;
  twoStageValidation: boolean;
}

export interface ScoreStats {
  avg: number;
  category: string;
  dist: Record<1 | 2 | 3 | 4, number>;
}

export interface AiAnalysisResponse {
  analysis: string;
  kekuatan: string;
  perbaikan: string;
  rekomendasi: string;
  rtlSuggestion?: Partial<RtlPlan>;
  scoreInterpretation?: string;
}

export interface ToastNotice {
  text: string;
  type: 'success' | 'error' | 'info';
}

export interface CloudSchoolSettingsPayload {
  schoolName: string;
  schoolLevel: string;
  kopAuthority: string;
  schoolNpsn: string;
  schoolAddress: string;
  academicYear: string;
  headmasterName: string;
  headmasterNip: string;
  internalSupervisorName: string;
  internalSupervisorNip: string;
  supervisorName: string;
  supervisorNip: string;
  twoStageValidation: boolean;
}

export interface CloudAppSnapshot {
  version?: number;
  exportedAt?: string;
  schoolConfig: CloudSchoolSettingsPayload;
  programConfig: ProgramTemplateConfig;
  uploadedProgramFile: UploadedProgramFile | null;
  rubricSections: RubricSection[];
  instrumentTitle: string;
  gurus: Guru[];
  supervisions: SupervisionSession[];
  followUps: FollowUpItem[];
}

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  modifiedTime?: string;
  size?: string;
}
