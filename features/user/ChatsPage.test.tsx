import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';

const sendMessage = vi.hoisted(() => vi.fn());
const push = vi.hoisted(() => vi.fn());
const refresh = vi.hoisted(() => vi.fn());

vi.mock('@/app/(user)/dashboard/mensajes/actions', () => ({
  sendMessageAction: (...args: unknown[]) => sendMessage(...args),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh }),
}));

import ChatsPage from '@/features/user/ChatsPage';

const conversations = {
  success: true as const,
  conversations: [
    {
      id: 'conv-1',
      title: 'Consulta con Dra. Gómez',
      participants: [
        {
          userId: 'psy-1',
          name: 'Dra. Gómez',
          role: 'PSYCHOLOGIST',
          avatarUrl: null,
        },
      ],
      lastMessage: {
        body: 'Hola, ¿cómo te sientes hoy?',
        senderId: 'psy-1',
        createdAt: '2026-10-20T10:00:00Z',
      },
      unread: 1,
      blocked: false,
    },
    {
      id: 'conv-2',
      title: 'Seguimiento con Dr. Pérez',
      participants: [
        {
          userId: 'psy-2',
          name: 'Dr. Pérez',
          role: 'PSYCHOLOGIST',
          avatarUrl: null,
        },
      ],
      unread: 0,
      blocked: false,
    },
  ],
  unreadTotal: 1,
};

const messages = {
  success: true as const,
  conversation: {
    id: 'conv-1',
    title: 'Consulta con Dra. Gómez',
    participants: [
      {
        userId: 'psy-1',
        name: 'Dra. Gómez',
        role: 'PSYCHOLOGIST',
      },
    ],
    blocked: false,
  },
  messages: [
    {
      id: 'msg-1',
      senderId: 'psy-1',
      senderName: 'Dra. Gómez',
      body: 'Hola, ¿cómo te sientes hoy?',
      createdAt: '2026-10-20T10:00:00Z',
    },
    {
      id: 'msg-2',
      senderId: 'user-1',
      senderName: 'Usuario Uno',
      body: 'Muy bien, gracias.',
      createdAt: '2026-10-20T10:05:00Z',
    },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
  ;(sendMessage as any).mockResolvedValue({ ok: true });
  ;(push as any).mockImplementation(() => {});
  ;(refresh as any).mockImplementation(() => {});
});

describe('ChatsPage — lista de conversaciones', () => {
  it('renderiza conversaciones reales con datos públicos únicamente', () => {
    render(<ChatsPage conversations={conversations} messages={null} error={null} />);

    expect(screen.getByText('Consulta con Dra. Gómez')).toBeInTheDocument();
    expect(screen.getByText('Seguimiento con Dr. Pérez')).toBeInTheDocument();
    expect(screen.getByText(/Dra\. Gómez/, { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Pérez/, { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText(/1 no leído/)).toBeInTheDocument();
  });

  it('no muestra datos ilustrativos ni sello de ejemplo', () => {
    render(<ChatsPage conversations={conversations} messages={null} error={null} />);

    expect(screen.queryByText('Ejemplo')).not.toBeInTheDocument();
    expect(screen.queryByText(/datos ilustrativos/)).not.toBeInTheDocument();
  });

  it('no expone datos privados de conversaciones o participantes', () => {
    render(<ChatsPage conversations={conversations} messages={null} error={null} />);

    const pageContent = screen.getByText('Consulta con Dra. Gómez').closest('section')?.textContent ?? '';
    expect(pageContent).not.toContain('email');
    expect(pageContent).not.toContain('phone');
    expect(pageContent).not.toContain('password');
    expect(pageContent).not.toContain('twoFactor');
  });

  it('muestra estado vacío cuando no hay conversaciones', () => {
    render(
      <ChatsPage
        conversations={{ success: true, conversations: [], unreadTotal: 0 }}
        messages={null}
        error={null}
      />,
    );

    expect(screen.getByText(/No tienes conversaciones activas/)).toBeInTheDocument();
    expect(screen.queryByText('Consulta con Dra. Gómez')).not.toBeInTheDocument();
  });

  it('muestra estado de error cuando la consulta falla', () => {
    render(<ChatsPage conversations={null as any} messages={null} error='No se pudieron cargar las conversaciones' />);

    expect(screen.getByText('No se pudieron cargar las conversaciones')).toBeInTheDocument();
    expect(screen.queryByText('Consulta con Dra. Gómez')).not.toBeInTheDocument();
  });
});

describe('ChatsPage — vista de conversación activa', () => {
  it('renderiza mensajes de la conversación seleccionada', () => {
    render(<ChatsPage conversations={conversations} messages={messages} error={null} conversationId='conv-1' />);

    expect(screen.getByText('Consulta con Dra. Gómez', { selector: 'h2' })).toBeInTheDocument();
    expect(screen.getByText('Hola, ¿cómo te sientes hoy?')).toBeInTheDocument();
    expect(screen.getByText('Muy bien, gracias.')).toBeInTheDocument();
    expect(screen.getByText('Dra. Gómez')).toBeInTheDocument();
    expect(screen.getByText('Usuario Uno')).toBeInTheDocument();
  });

  it('muestra acceso denegado cuando conversationId no tiene mensajes', () => {
    render(
      <ChatsPage
        conversations={conversations}
        messages={null}
        error={null}
        conversationId='conv-inexistente'
      />,
    );

    expect(screen.getByText('No tienes acceso a esta conversación.')).toBeInTheDocument();
  });

  it('muestra alerta cuando la conversación está bloqueada', () => {
    const blockedMessages = {
      ...messages,
      conversation: { ...messages.conversation, blocked: true },
    };
    render(
      <ChatsPage
        conversations={conversations}
        messages={blockedMessages}
        error={null}
        conversationId='conv-1'
      />,
    );

    expect(screen.getByText(/Esta conversación está bloqueada/)).toBeInTheDocument();
  });
});

describe('ChatsPage — envío de mensaje', () => {
  it('envía un mensaje usando identidad de la conversación seleccionada', async () => {
    render(
      <ChatsPage
        conversations={conversations}
        messages={messages}
        error={null}
        conversationId='conv-1'
      />,
    );

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...');
    fireEvent.input(textarea, { target: { value: 'Necesito ayuda con mi ansiedad.' } });

    const button = screen.getByText('Enviar');
    fireEvent.click(button);

    await vi.waitFor(() => {
      expect(sendMessage).toHaveBeenCalledWith({
        conversationId: 'conv-1',
        body: 'Necesito ayuda con mi ansiedad.',
      });
    });
  });

  it('no envía mensaje vacío', async () => {
    render(
      <ChatsPage
        conversations={conversations}
        messages={messages}
        error={null}
        conversationId='conv-1'
      />,
    );

    const button = screen.getByText('Enviar');
    fireEvent.click(button);

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('muestra confirmación solo tras respuesta válida del servidor', async () => {
    render(
      <ChatsPage
        conversations={conversations}
        messages={messages}
        error={null}
        conversationId='conv-1'
      />,
    );

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...');
    fireEvent.input(textarea, { target: { value: 'Mensaje de prueba.' } });

    const button = screen.getByText('Enviar');
    fireEvent.click(button);

    await vi.waitFor(() => {
      expect(screen.getByText('Mensaje enviado')).toBeInTheDocument();
    });
  });

  it('muestra error de envío cuando el servidor rechaza', async () => {
    ;(sendMessage as any).mockResolvedValue({ ok: false, error: 'No tienes acceso a esta conversación.' });

    render(
      <ChatsPage
        conversations={conversations}
        messages={messages}
        error={null}
        conversationId='conv-1'
      />,
    );

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...');
    fireEvent.input(textarea, { target: { value: 'Mensaje de prueba.' } });

    const button = screen.getByText('Enviar');
    fireEvent.click(button);

    await vi.waitFor(() => {
      expect(screen.getByText('No tienes acceso a esta conversación.')).toBeInTheDocument();
    });
  });

  it('deshabilita el botón durante el envío para evitar duplicados', async () => {
    let resolveSend!: (value: unknown) => void;
    const sendPromise = new Promise((resolve) => {
      resolveSend = resolve;
    });
    ;(sendMessage as any).mockReturnValue(sendPromise);

    render(
      <ChatsPage
        conversations={conversations}
        messages={messages}
        error={null}
        conversationId='conv-1'
      />,
    );

    const textarea = screen.getByPlaceholderText('Escribe tu mensaje...');
    fireEvent.input(textarea, { target: { value: 'Mensaje de prueba.' } });

    const button = screen.getByText('Enviar');
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(screen.getByText('Enviando...')).toBeInTheDocument();

    resolveSend({ ok: true });
    await act(async () => {
      await sendPromise;
    });

    await waitFor(() => {
      expect(button).not.toBeDisabled();
    });
  });
});
