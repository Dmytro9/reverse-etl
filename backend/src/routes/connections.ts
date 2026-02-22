import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { connectionController } from "../controllers/connectionController";

const router = Router();

router.post(
  "/test",
  asyncHandler(connectionController.testConnection.bind(connectionController)),
);

router.get(
  "/:connectionId/tables",
  asyncHandler(connectionController.listTables.bind(connectionController)),
);

router.get(
  "/:connectionId/tables/:table/columns",
  asyncHandler(connectionController.listColumns.bind(connectionController)),
);

router.post(
  "/:connectionId/preview",
  asyncHandler(connectionController.preview.bind(connectionController)),
);

export default router;
