import { Request, Response } from "express";
import { connectionService } from "../services/connectionService";
import { tableService } from "../services/tableService";
import { mappingService } from "../services/mappingService";
import {
  testConnectionSchema,
  previewRequestSchema,
} from "../validation/schemas";
import type {
  TestConnectionResponse,
  TableInfo,
  ColumnInfo,
  PreviewResponse,
} from "../types";

export class ConnectionController {
  async testConnection(req: Request, res: Response): Promise<void> {
    const { connectionString } = testConnectionSchema.parse(req.body);

    const connectionId =
      await connectionService.createConnection(connectionString);

    const response: TestConnectionResponse = {
      ok: true,
      connectionId,
    };

    res.json(response);
  }

  async listTables(req: Request, res: Response): Promise<void> {
    const connectionId = req.params.connectionId as string;
    const pool = connectionService.getPool(connectionId);

    const tables = await tableService.listTables(pool);

    const response: TableInfo = { tables };
    res.json(response);
  }

  async listColumns(req: Request, res: Response): Promise<void> {
    const connectionId = req.params.connectionId as string;
    const table = req.params.table as string;
    const pool = connectionService.getPool(connectionId);

    const columns = await tableService.listColumns(pool, table);

    const response: ColumnInfo = { columns };
    res.json(response);
  }

  async preview(req: Request, res: Response): Promise<void> {
    const connectionId = req.params.connectionId as string;
    const { table, limit, mapping } = previewRequestSchema.parse(req.body);

    const pool = connectionService.getPool(connectionId);

    const rows = await mappingService.fetchAndTransformData(
      pool,
      table,
      limit,
      mapping,
    );

    const response: PreviewResponse = { rows };
    res.json(response);
  }
}

export const connectionController = new ConnectionController();
