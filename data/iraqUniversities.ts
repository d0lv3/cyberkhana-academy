/* ─── Iraqi universities ───
 * Public + private universities and university colleges across Iraq (federal
 * + Kurdistan Region). Compiled from the Ministry of Higher Education registry
 * (mirrored by muc.edu.iq) and Wikipedia's list for the Kurdistan Region.
 *
 * Students PICK from this list (they don't type their own). Arabic names are
 * provided for the major public universities so Arabic-speaking students can
 * search in either language; every entry is searchable by its English name.
 */

export interface IraqUniversity {
  /** Canonical English name — this is what gets stored on the profile. */
  name: string;
  /** Arabic name, where confidently known (used for search + Arabic display). */
  ar?: string;
  type: 'public' | 'private';
  region: 'federal' | 'kurdistan';
}

/** Stored on the profile when a student says they aren't enrolled anywhere. */
export const NOT_ENROLLED = '__not_enrolled__';

export const IRAQ_UNIVERSITIES: IraqUniversity[] = [
  // ── Federal public ──
  { name: 'University of Baghdad', ar: 'جامعة بغداد', type: 'public', region: 'federal' },
  { name: 'Mustansiriyah University', ar: 'الجامعة المستنصرية', type: 'public', region: 'federal' },
  { name: 'University of Technology', ar: 'الجامعة التكنولوجية', type: 'public', region: 'federal' },
  { name: 'Al-Nahrain University', ar: 'جامعة النهرين', type: 'public', region: 'federal' },
  { name: 'Al-Iraqia University', ar: 'الجامعة العراقية', type: 'public', region: 'federal' },
  { name: 'University of Basrah', ar: 'جامعة البصرة', type: 'public', region: 'federal' },
  { name: 'Basra University for Oil and Gas', ar: 'جامعة البصرة للنفط والغاز', type: 'public', region: 'federal' },
  { name: 'University of Mosul', ar: 'جامعة الموصل', type: 'public', region: 'federal' },
  { name: 'University of Ninevah', ar: 'جامعة نينوى', type: 'public', region: 'federal' },
  { name: 'University of Kufa', ar: 'جامعة الكوفة', type: 'public', region: 'federal' },
  { name: 'University of Kerbala', ar: 'جامعة كربلاء', type: 'public', region: 'federal' },
  { name: 'University of Babylon', ar: 'جامعة بابل', type: 'public', region: 'federal' },
  { name: 'Al-Qasim Green University', ar: 'جامعة القاسم الخضراء', type: 'public', region: 'federal' },
  { name: 'Tikrit University', ar: 'جامعة تكريت', type: 'public', region: 'federal' },
  { name: 'University of Anbar', ar: 'جامعة الأنبار', type: 'public', region: 'federal' },
  { name: 'University of Diyala', ar: 'جامعة ديالى', type: 'public', region: 'federal' },
  { name: 'University of Kirkuk', ar: 'جامعة كركوك', type: 'public', region: 'federal' },
  { name: 'University of Al-Qadisiyah', ar: 'جامعة القادسية', type: 'public', region: 'federal' },
  { name: 'University of Thi-Qar', ar: 'جامعة ذي قار', type: 'public', region: 'federal' },
  { name: 'University of Wasit', ar: 'جامعة واسط', type: 'public', region: 'federal' },
  { name: 'University of Misan', ar: 'جامعة ميسان', type: 'public', region: 'federal' },
  { name: 'Al-Muthanna University', ar: 'جامعة المثنى', type: 'public', region: 'federal' },
  { name: 'University of Sumer', ar: 'جامعة سومر', type: 'public', region: 'federal' },
  { name: 'University of Samarra', ar: 'جامعة سامراء', type: 'public', region: 'federal' },
  { name: 'University of Fallujah', ar: 'جامعة الفلوجة', type: 'public', region: 'federal' },
  { name: 'University of Telafer', ar: 'جامعة تلعفر', type: 'public', region: 'federal' },
  { name: 'University of Al-Hamdaniya', ar: 'جامعة الحمدانية', type: 'public', region: 'federal' },
  { name: 'Al-Karkh University of Science', ar: 'جامعة الكرخ للعلوم', type: 'public', region: 'federal' },
  { name: 'Al-Furat Al-Awsat Technical University', ar: 'جامعة الفرات الأوسط التقنية', type: 'public', region: 'federal' },
  { name: 'Middle Technical University', ar: 'الجامعة التقنية الوسطى', type: 'public', region: 'federal' },
  { name: 'Southern Technical University', ar: 'الجامعة التقنية الجنوبية', type: 'public', region: 'federal' },
  { name: 'Northern Technical University', ar: 'الجامعة التقنية الشمالية', type: 'public', region: 'federal' },
  { name: 'University of Information and Communication Technology', ar: 'جامعة تكنولوجيا المعلومات والاتصالات', type: 'public', region: 'federal' },
  { name: 'Jaber Ibn Hayyan Medical University', ar: 'جامعة جابر بن حيان الطبية', type: 'public', region: 'federal' },
  { name: 'Ibn Sina University for Medical and Pharmaceutical Sciences', type: 'public', region: 'federal' },
  { name: 'Imam Al-Adham College', type: 'public', region: 'federal' },
  { name: 'Imam Al-Kadhum College', type: 'public', region: 'federal' },

  // ── Kurdistan Region public ──
  { name: 'University of Sulaimani', ar: 'جامعة السليمانية', type: 'public', region: 'kurdistan' },
  { name: 'Salahaddin University-Erbil', ar: 'جامعة صلاح الدين', type: 'public', region: 'kurdistan' },
  { name: 'University of Duhok', ar: 'جامعة دهوك', type: 'public', region: 'kurdistan' },
  { name: 'University of Zakho', ar: 'جامعة زاخو', type: 'public', region: 'kurdistan' },
  { name: 'University of Raparin', type: 'public', region: 'kurdistan' },
  { name: 'University of Garmian', type: 'public', region: 'kurdistan' },
  { name: 'University of Halabja', type: 'public', region: 'kurdistan' },
  { name: 'Koya University', type: 'public', region: 'kurdistan' },
  { name: 'Soran University', type: 'public', region: 'kurdistan' },
  { name: 'Charmo University', type: 'public', region: 'kurdistan' },
  { name: 'Hawler Medical University', type: 'public', region: 'kurdistan' },
  { name: 'Erbil Polytechnic University', type: 'public', region: 'kurdistan' },
  { name: 'Sulaimani Polytechnic University', type: 'public', region: 'kurdistan' },
  { name: 'Duhok Polytechnic University', type: 'public', region: 'kurdistan' },

  // ── Federal private ──
  { name: 'Islamic University', type: 'private', region: 'federal' },
  { name: 'Al-Kitab University', type: 'private', region: 'federal' },
  { name: 'Ahl Al-Bayt University', type: 'private', region: 'federal' },
  { name: 'University of Al-Kafeel', type: 'private', region: 'federal' },
  { name: 'National University of Science and Technology', type: 'private', region: 'federal' },
  { name: 'Al-Bayan University', type: 'private', region: 'federal' },
  { name: 'University of Al-Ameed', type: 'private', region: 'federal' },
  { name: 'Al-Ayen University', type: 'private', region: 'federal' },
  { name: 'Al-Mustafa Al-Ameen University', type: 'private', region: 'federal' },
  { name: 'Al-Zahraa University for Women', type: 'private', region: 'federal' },
  { name: 'The American University in Baghdad', type: 'private', region: 'federal' },
  { name: 'Uruk University', type: 'private', region: 'federal' },
  { name: 'University of Warith Al-Anbiyaa', type: 'private', region: 'federal' },
  { name: 'Gilgamesh University', type: 'private', region: 'federal' },
  { name: "Imam Ja'afar Al-Sadiq University", type: 'private', region: 'federal' },
  { name: 'Al-Farahidi University', type: 'private', region: 'federal' },
  { name: 'Al-Maqal University', type: 'private', region: 'federal' },
  { name: 'Al-Turath University', type: 'private', region: 'federal' },
  { name: 'Al-Mansour University College', type: 'private', region: 'federal' },
  { name: 'Al-Rafidain University College', type: 'private', region: 'federal' },
  { name: 'Al-Maarif University College', type: 'private', region: 'federal' },
  { name: 'Baghdad College of Economic Sciences', type: 'private', region: 'federal' },
  { name: 'Bilad Alrafidain University College', type: 'private', region: 'federal' },
  { name: 'Al-Hadi University College', type: 'private', region: 'federal' },
  { name: 'Al-Nukhba University College', type: 'private', region: 'federal' },
  { name: 'Al-Tusi University College', type: 'private', region: 'federal' },
  { name: 'Al-Qalam University College', type: 'private', region: 'federal' },
  { name: 'Al-Hikma University College', type: 'private', region: 'federal' },
  { name: 'Al-Mustaqbal University College', type: 'private', region: 'federal' },
  { name: 'Al-Hilla University College', type: 'private', region: 'federal' },
  { name: 'Al-Safwa University College', type: 'private', region: 'federal' },
  { name: 'Al-Kunooze University College', type: 'private', region: 'federal' },
  { name: 'Al-Zahrawi University College', type: 'private', region: 'federal' },
  { name: 'Al-Amal University College', type: 'private', region: 'federal' },
  { name: 'Ashur University College', type: 'private', region: 'federal' },
  { name: 'Madenat Alelem University College', type: 'private', region: 'federal' },
  { name: 'Al-Mustafa University College', type: 'private', region: 'federal' },
  { name: 'Al-Noor University College', type: 'private', region: 'federal' },
  { name: 'Al-Salam University College', type: 'private', region: 'federal' },
  { name: "Al-Ma'moon University College", type: 'private', region: 'federal' },
  { name: 'Shatt Al-Arab University College', type: 'private', region: 'federal' },
  { name: 'Al-Hadba University College', type: 'private', region: 'federal' },
  { name: 'Al-Yarmouk University College', type: 'private', region: 'federal' },
  { name: 'Baghdad College of Medical Sciences', type: 'private', region: 'federal' },
  { name: 'Iraq University College', type: 'private', region: 'federal' },
  { name: 'Sadr Iraq University College', type: 'private', region: 'federal' },
  { name: 'Al-Hussain University College', type: 'private', region: 'federal' },
  { name: 'Usul Al-Din University College', type: 'private', region: 'federal' },
  { name: 'Al-Esraa University', type: 'private', region: 'federal' },
  { name: 'Al-Kut University College', type: 'private', region: 'federal' },
  { name: 'Al-Farabi University College', type: 'private', region: 'federal' },
  { name: 'Al-Huda University College', type: 'private', region: 'federal' },
  { name: 'Dijlah University College', type: 'private', region: 'federal' },
  { name: 'Al-Taff University College', type: 'private', region: 'federal' },
  { name: 'Al-Nisour University College', type: 'private', region: 'federal' },
  { name: 'Basra University College of Science and Technology', type: 'private', region: 'federal' },
  { name: 'Al-Imam University College', type: 'private', region: 'federal' },
  { name: 'Al-Rasheed University College', type: 'private', region: 'federal' },
  { name: 'Al-Bani University College', type: 'private', region: 'federal' },
  { name: 'Al-Fiqh University College', type: 'private', region: 'federal' },

  // ── Kurdistan Region private ──
  { name: 'The American University of Kurdistan', type: 'private', region: 'kurdistan' },
  { name: 'University of Kurdistan Hewler', type: 'private', region: 'kurdistan' },
  { name: 'Komar University of Science and Technology', type: 'private', region: 'kurdistan' },
  { name: 'Cihan University', type: 'private', region: 'kurdistan' },
  { name: 'Tishk International University', type: 'private', region: 'kurdistan' },
  { name: 'Knowledge University', type: 'private', region: 'kurdistan' },
  { name: 'Catholic University in Erbil', type: 'private', region: 'kurdistan' },
  { name: 'Lebanese French University', type: 'private', region: 'kurdistan' },
  { name: 'Nawroz University', type: 'private', region: 'kurdistan' },
  { name: 'University of Human Development', type: 'private', region: 'kurdistan' },
  { name: 'Qaiwan International University', type: 'private', region: 'kurdistan' },
  { name: 'Bayan University', type: 'private', region: 'kurdistan' },
];

/** Case-insensitive substring search over English + Arabic names. */
export function searchUniversities(query: string, limit = 50): IraqUniversity[] {
  const q = query.trim().toLowerCase();
  if (!q) return IRAQ_UNIVERSITIES.slice(0, limit);
  return IRAQ_UNIVERSITIES.filter(
    (u) => u.name.toLowerCase().includes(q) || (u.ar && u.ar.includes(query.trim()))
  ).slice(0, limit);
}

/** How to display a stored university value in a given language. */
export function universityLabel(
  value: string | null | undefined,
  lang: 'en' | 'ar'
): { text: string; isNotEnrolled: boolean; isSet: boolean } {
  if (!value) return { text: '', isNotEnrolled: false, isSet: false };
  if (value === NOT_ENROLLED) {
    return { text: lang === 'ar' ? 'غير مسجّل' : 'Not enrolled', isNotEnrolled: true, isSet: true };
  }
  const match = IRAQ_UNIVERSITIES.find((u) => u.name === value);
  return { text: lang === 'ar' && match?.ar ? match.ar : value, isNotEnrolled: false, isSet: true };
}
