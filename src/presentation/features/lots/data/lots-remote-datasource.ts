import { Injectable, inject } from '@angular/core';
import { AuthHttpService } from '../../../shared/services/auth-http.service';
import { resolveApiBaseUrl } from '../../../shared/services/api-base';

const API_BASE = resolveApiBaseUrl();

export interface LotRawDto {
  id: string;
  productId: string;
  lotCode: string;
  quantityReceived: number | string;
  quantityAvailable: number | string;
  unitCost: number | string;
  estimatedUnitProfit: number | string;
  receivedAt: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class LotsRemoteDataSource {
  private readonly authHttp = inject(AuthHttpService);

  async fetchLotsByProduct(productId: string, signal?: AbortSignal): Promise<LotRawDto[]> {
    const params = new URLSearchParams({ productId });
    const response = await this.authHttp.fetchWithRefresh(
      `${API_BASE}/lots?${params.toString()}`,
      signal ? { signal } : undefined,
    );
    if (!response.ok) throw new Error(`Request failed: ${response.status}`);

    const body = (await response.json()) as unknown;
    const rows = Array.isArray(body) ? body : ((body as { data?: LotRawDto[] }).data ?? []);

    return rows.map((row: any) => ({
      id: String(row.id),
      productId: String(row.productId ?? productId),
      lotCode: String(row.lotCode ?? ''),
      quantityReceived: Number(row.quantityReceived ?? 0),
      quantityAvailable: Number(row.quantityAvailable ?? 0),
      unitCost: Number(row.unitCost ?? 0),
      estimatedUnitProfit: Number(row.estimatedUnitProfit ?? 0),
      receivedAt: String(row.receivedAt ?? ''),
      expiresAt: row.expiresAt ? String(row.expiresAt) : null,
      createdAt: String(row.createdAt ?? ''),
      updatedAt: String(row.updatedAt ?? ''),
    }));
  }
}
