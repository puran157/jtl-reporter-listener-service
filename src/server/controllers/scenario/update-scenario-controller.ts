import { Request, Response } from "express"
import { db } from "../../../db/db"
import { updateScenario } from "../../queries/scenario"
import { StatusCode } from "../../utils/status-code"


export const updateScenarioController = async (req: Request, res: Response) => {
  const { projectName, scenarioName } = req.params
  const {
    thresholds,
    analysisEnabled,
    scenarioName: name,
    deleteSamples,
    generateShareToken,
    zeroErrorToleranceEnabled,
    keepTestRunsPeriod,
  } = req.body
  await db.none(updateScenario(projectName, scenarioName, name, analysisEnabled,
    thresholds, deleteSamples, zeroErrorToleranceEnabled, keepTestRunsPeriod, generateShareToken))
  res.status(StatusCode.NoContent).send()
}
