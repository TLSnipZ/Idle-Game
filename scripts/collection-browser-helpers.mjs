export async function openCollectionView(page, view) {
  await page.locator('[data-collection-view="' + (view === 'garage' ? 'garage' : 'workshop') + '"]').click();
  if (view !== 'garage') await page.locator('[data-workshop-view="' + view + '"]').click();
}
export async function openGarageVehicle(page, id) {
  await openCollectionView(page, 'garage');
  const back = page.locator('.garage-back');
  if (await back.isVisible()) await back.click();
  await page.locator('[data-vehicle-id="' + id + '"]').click();
}
