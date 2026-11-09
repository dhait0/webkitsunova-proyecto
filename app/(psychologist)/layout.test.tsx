import { beforeEach, describe, expect, it, vi } from 'vitest';
import { isValidElement, type ReactElement } from 'react';

const requireRole = vi.hoisted(() => vi.fn());

vi.mock('@/lib/auth/guard', () => ({ requireRole }));
vi.mock('@/features/PsyLayout', () => ({ default: () => null }));

import PsychologistLayout from './layout';
import PsyAdminNotice from '@/features/psy/PsyAdminNotice';

const child = <p>pantalla del psicólogo</p>;

beforeEach(() => {
  vi.resetAllMocks();
});

describe('PsychologistLayout', () => {
  it('muestra los hijos a un psicólogo', async () => {
    requireRole.mockResolvedValue({ id: 'psy-1', email: 'p@x.test', role: 'PSYCHOLOGIST' });

    const tree = (await PsychologistLayout({ children: child })) as ReactElement<{
      children: ReactElement;
    }>;

    expect(requireRole).toHaveBeenCalledWith('PSYCHOLOGIST');
    expect(tree.props.children).toBe(child);
  });

  it('sustituye las pantallas por el aviso cuando entra un administrador', async () => {
    requireRole.mockResolvedValue({ id: 'adm-1', email: 'a@x.test', role: 'ADMIN' });

    const tree = (await PsychologistLayout({ children: child })) as ReactElement<{
      children: ReactElement;
    }>;

    expect(isValidElement(tree.props.children)).toBe(true);
    expect(tree.props.children.type).toBe(PsyAdminNotice);
    expect(tree.props.children).not.toBe(child);
  });
});
