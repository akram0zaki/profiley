import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LanguageProvider } from '../../contexts/language-context';
import { AccountDataExportCard } from '../account-data-export-card';

const exportUserDataMock = vi.fn();

vi.mock('../../../lib/api', async () => {
  const actual = await vi.importActual('../../../lib/api');
  return {
    ...actual,
    api: {
      exportUserData: (...args: unknown[]) => exportUserDataMock(...args),
    },
  };
});

describe('AccountDataExportCard', () => {
  const createObjectUrl = vi.fn(() => 'blob:test-url');
  const revokeObjectUrl = vi.fn();
  const clickMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    exportUserDataMock.mockResolvedValue({
      manifest: {
        exportedAt: '2026-05-03T12:00:00.000Z',
        profileyVersion: 'self-service-export-v1',
        subjectUserId: 'user-1',
        deliveryMode: 'self_service_download',
        format: 'json_bundle',
        tables: ['app_users'],
        tableCounts: { app_users: 1 },
        storageArtifacts: [],
      },
      tables: {
        app_users: [{ id: 'user-1' }],
      },
    });

    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectUrl,
    });

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', tagName) as HTMLAnchorElement;
      if (tagName === 'a') {
        element.click = clickMock;
      }
      return element;
    }) as typeof document.createElement);
  });

  it('downloads the export bundle after a successful export request', async () => {
    const user = userEvent.setup();

    render(
      <LanguageProvider>
        <AccountDataExportCard />
      </LanguageProvider>,
    );

    await user.click(screen.getByRole('button', { name: 'Download data export' }));

    await waitFor(() => {
      expect(exportUserDataMock).toHaveBeenCalledTimes(1);
    });
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(clickMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith('blob:test-url');
  });
});