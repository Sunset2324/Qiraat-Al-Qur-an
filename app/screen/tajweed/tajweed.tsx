import ComingSoon from "../../../src/components/ui/ComingSoon";
import { useLanguage } from "../../../src/context/LanguageContext";

/**
 * Materi tajwid sedang direvisi (24 Nov 2026): sementara "Segera hadir".
 * Versi lama layar ini ada di riwayat git sebelum PR "tinta bebas"; data tetap di src/data/tajweed.
 */
export default function TajweedScreen() {
  const { t } = useLanguage();
  return <ComingSoon title={t("featTajweed")} arabic="التجويد" description={t("tajweedSoonDesc")} />;
}
