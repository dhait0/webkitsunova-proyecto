import Psychologists from '@/features/user/PsychologistsClient';
import { getAvailablePsychologistsAction } from './actions';

export default async function PsychologistsRoute() {
  let psychologists: Awaited<ReturnType<typeof getAvailablePsychologistsAction>> = [];
  try {
    psychologists = await getAvailablePsychologistsAction();
  } catch (error) {
    psychologists = [];
  }
  return <Psychologists psychologists={psychologists} />;
}
