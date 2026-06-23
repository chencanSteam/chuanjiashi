import { chromium } from 'playwright-core';

const routes = [
  { name: 'home', path: '/' },
  { name: 'interview', path: '/interview' },
  { name: 'biography', path: '/biography' },
  { name: 'archive', path: '/archive' },
  { name: 'family', path: '/family' },
  { name: 'genealogy', path: '/genealogy' },
  { name: 'family-hall', path: '/family-hall' },
  { name: 'digital-person', path: '/digital-person' },
  { name: 'training-records', path: '/digital-person/training-records' },
  { name: 'training-report', path: '/digital-person/training-report' },
  { name: 'digital-companion', path: '/digital-companion' },
  { name: 'government', path: '/government' },
  { name: 'settings', path: '/settings' },
  { name: 'family-members', path: '/family/members' },
  { name: 'family-member-detail', path: '/family/members/%E5%BC%A0%E6%98%8E%E8%BF%9C' },
  { name: 'family-album', path: '/family/album/2024%E6%98%A5%E6%B8%B8%E8%AE%B0' },
  { name: 'family-story', path: '/family/story/%E7%88%B7%E7%88%B7%E7%9A%84%E8%AE%B0%E5%BF%86' },
  { name: 'family-event', path: '/family/event/%E5%AE%B6%E6%97%8F%E8%81%9A%E4%BC%9A' },
  { name: 'archive-media', path: '/archive/media' },
  { name: 'archive-event-edit', path: '/archive/event/1992/edit' },
  { name: 'genealogy-table', path: '/genealogy/table' },
  { name: 'genealogy-documents', path: '/genealogy/documents' },
  { name: 'government-application', path: '/government/application/ZJ-20260618-001' },
  { name: 'government-policies', path: '/government/policies' },
  { name: 'family-hall-project', path: '/family-hall/project/%E5%BC%A0%E6%B0%8F%E5%AE%B6%E9%A3%8E%E9%A6%86' },
  { name: 'family-hall-activity', path: '/family-hall/activity' },
  { name: 'ai-refine', path: '/family-hall/ai-refine' },
  { name: 'story-library', path: '/family-hall/story-library' },
  { name: 'family-assessment', path: '/family-hall/assessment' },
  { name: 'hall-rules', path: '/family-hall/project/%E5%BC%A0%E6%B0%8F%E5%AE%B6%E9%A3%8E%E9%A6%86/rules' },
  { name: 'hall-stories', path: '/family-hall/project/%E5%BC%A0%E6%B0%8F%E5%AE%B6%E9%A3%8E%E9%A6%86/stories' },
  { name: 'hall-courses', path: '/family-hall/project/%E5%BC%A0%E6%B0%8F%E5%AE%B6%E9%A3%8E%E9%A6%86/courses' },
  { name: 'hall-election', path: '/family-hall/project/%E5%BC%A0%E6%B0%8F%E5%AE%B6%E9%A3%8E%E9%A6%86/election' },
  { name: 'hall-mentor', path: '/family-hall/project/%E5%BC%A0%E6%B0%8F%E5%AE%B6%E9%A3%8E%E9%A6%86/mentor' },
  { name: 'family-calendar', path: '/family/calendar' },
  { name: 'family-albums', path: '/family/albums' },
  { name: 'family-stories', path: '/family/stories' },
  { name: 'family-child', path: '/family/child' },
  { name: 'family-child-category', path: '/family/child/growth' },
  { name: 'family-relations', path: '/family/relations' },
  { name: 'family-roles', path: '/family/roles' },
  { name: 'family-motto', path: '/family/motto' },
  { name: 'family-inherit', path: '/family/inherit/archive' },
  { name: 'family-events', path: '/family/events' },
  { name: 'archive-places', path: '/archive/places' },
  { name: 'archive-completeness', path: '/archive/completeness' },
  { name: 'government-dashboard', path: '/government/dashboard' },
  { name: 'family-hall-deploy', path: '/family-hall/deploy' },
  { name: 'settings-account', path: '/settings/account' },
  { name: 'settings-notification', path: '/settings/notification' },
];

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1491, height: 900 } });
  for (const r of routes) {
    try {
      await page.goto(`http://localhost:5173${r.path}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(800);
      await page.screenshot({ path: `scripts/${r.name}.png`, fullPage: true });
      console.log(`saved ${r.name}.png`);
    } catch (e) {
      console.log(`failed ${r.name}: ${(e as Error).message}`);
    }
  }
  await browser.close();
})();
