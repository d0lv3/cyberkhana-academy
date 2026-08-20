/**
 * Byline for a row in the studio's "all published content" sections.
 *
 * Those sections list everything live across every author, the signed-in
 * admin's own work included — so a row needs to say whose it is, and "You"
 * reads better than seeing your own name quoted back at you.
 */
export function ownerLabel(
  ownerId: string,
  ownerName: string,
  meId: string | undefined,
  lang: 'en' | 'ar'
): string {
  if (meId && ownerId === meId) return lang === 'ar' ? 'أنت' : 'You';
  return ownerName;
}
