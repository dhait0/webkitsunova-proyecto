import { requireUser } from '@/lib/auth/guard';
import { getPsychologistProfile } from '@/services/psy/psychologists.service';
import PsychologistProfilePage from '@/features/user/PsychologistProfilePage';

export default async function PsychologistProfileRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireUser();
  const { id } = await params;

  let profile;
  let error: string | null = null;

  try {
    profile = await getPsychologistProfile(id);
  } catch (caught) {
    error = caught instanceof Error ? caught.message : 'No se pudo cargar el perfil';
    profile = null;
  }

  return <PsychologistProfilePage profile={profile} error={error} />;
}
