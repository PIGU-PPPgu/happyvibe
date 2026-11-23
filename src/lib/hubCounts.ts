// 资源中心页头的三个计数。课件只计自产，Skill 只计已实测的。
import { getCollection } from 'astro:content';

export interface HubCounts {
  courseware: number;
  skills: number;
  tools: number;
}

export async function hubCounts(): Promise<HubCounts> {
  const [resources, skills, tools] = await Promise.all([
    getCollection('resources'),
    getCollection('skills'),
    getCollection('tools'),
  ]);
  return {
    courseware: resources.filter((r) => r.data.kind !== 'external').length,
    skills: skills.filter((s) => s.data.status === 'tested').length,
    tools: tools.length,
  };
}
