import { ItemDataType } from './items.model';

export const createNewItem = (scenarioName, startTime, environment, note, status, projectName, hostname) => {
  return {
    text: `INSERT INTO jtl.items(scenario_id, start_time, environment, note, status, hostname) VALUES(
      (SELECT sc.id FROM jtl.scenario as sc
        LEFT JOIN jtl.projects as p ON p.id = sc.project_id
        WHERE sc.name = $1
        AND p.project_name = $6), $2, $3, $4, $5, $7) RETURNING id`,
    values: [scenarioName, startTime, environment, note, status, projectName, hostname]
  };
};

export const saveKpiData = (itemId, data) => {
  return {
    text: 'INSERT INTO jtl.data(item_id, item_data, data_type) VALUES($1, $2, $3)',
    values: [itemId, data, ItemDataType.Kpi]
  };
};

export const savePlotData = (itemId, data) => {
  return {
    text: 'INSERT INTO jtl.charts(item_id, plot_data) VALUES($1, $2)',
    values: [itemId, data]
  };
};

export const findItem = (itemId, projectName, scenarioName) => {
  return {
    // tslint:disable-next-line:max-line-length
    text: `SELECT charts.plot_data, note, environment, status, hostname, (SELECT items.id FROM jtl.items as items
      LEFT JOIN jtl.charts as charts ON charts.item_id = items.id
      LEFT JOIN jtl.scenario as s ON s.id = items.scenario_id
      LEFT JOIN jtl.projects as p ON p.id = s.project_id
      WHERE s.name = $3
      AND p.project_name = $2
      AND base is not null) as base_id
    FROM jtl.items as items
    LEFT JOIN jtl.charts as charts ON charts.item_id = items.id
    LEFT JOIN jtl.scenario as s ON s.id = items.scenario_id
    LEFT JOIN jtl.projects as p ON p.id = s.project_id
    WHERE items.id = $1
    AND p.project_name = $2
    AND s.name = $3;`,
    values: [itemId, projectName, scenarioName]
  };
};

export const findItemStats = (testItem) => {
  return {
    text: 'SELECT stats, overview FROM jtl.item_stat WHERE item_id = $1',
    values: [testItem]
  };
};

export const updateNote = (itemId, projectName, note) => {
  return {
    text: 'UPDATE jtl.items SET note = $3 WHERE id = $1 AND project_id = $2;',
    values: [itemId, projectName, note]
  };
};

export const saveItemStats = (itemId, stats, overview) => {
  return {
    text: 'INSERT INTO jtl.item_stat(item_id, stats, overview) VALUES($1, $2, $3);',
    values: [itemId, stats, overview]
  };
};

export const updateTestItemInfo = (itemId, scenarioName, projectName, note, environment, hostname) => {
  return {
    text: `UPDATE jtl.items as it
    SET note = $3, environment = $4, hostname = $6
    FROM jtl.scenario as s
    WHERE it.id = $1
    AND s.project_id = (SELECT id FROM jtl.projects WHERE project_name = $2)
    AND s.name = $5`,
    values: [itemId, projectName, note, environment, scenarioName, hostname]
  };
};

export const deleteItem = (projectName, scenarioName, itemId) => {
  return {
    text: `DELETE FROM jtl.items as it
    USING jtl.scenario as s
    WHERE it.id = $1
    AND s.name = $2
    AND s.project_id = (SELECT id FROM jtl.projects WHERE project_name = $3)`,
    values: [itemId, scenarioName, projectName]
  };
};

export const saveData = (itemId, data, dataType) => {
  return {
    text: 'INSERT INTO jtl.data(item_id, item_data, data_type) VALUES($1, $2, $3)',
    values: [itemId, data, dataType]
  };
};


export const findErrors = (itemId, projectName) => {
  return {
    text: `SELECT item_data as errors FROM jtl.items as items
    LEFT JOIN jtl.data as data ON data.item_id = items.id
    LEFT JOIN jtl.scenario as s ON s.id = items.scenario_id
    LEFT JOIN jtl.projects as p ON p.id = s.project_id
    WHERE items.id = $1
    AND p.project_name = $2
    AND data_type = $3`,
    values: [itemId, projectName, ItemDataType.Error]
  };
};

export const findAttachements = itemId => {
  return {
    text: `SELECT d.data_type as type FROM jtl.data d
    WHERE d.item_id = $1
    AND d.data_type != $2;`,
    values: [itemId, ItemDataType.Kpi]
  };
};

export const removeCurrentBaseFlag = (scenarioName) => {
  return {
    text: `UPDATE jtl.items SET base = NULL
    WHERE base
    AND scenario_id = (SELECT id FROM jtl.scenario WHERE name = $1);`,
    values: [scenarioName]
  };
};

export const setBaseFlag = (itemId, scenarioName) => {
  return {
    text: `UPDATE jtl.items SET base = TRUE
    WHERE id = $1
    AND scenario_id = (SELECT id FROM jtl.scenario WHERE name = $2);`,
    values: [itemId, scenarioName]
  };
};

export const dashboardStats = () => {
  return {
    text: `
    SELECT round(AVG((overview -> 'maxVu')::int)) as "avgVu",
    round(AVG((overview -> 'duration')::int)) as "avgDuration",
    round(SUM((overview -> 'duration')::int)) as "totalDuration",
    count(*) as "totalCount" from jtl.item_stat;`
  };
};

export const getLabelHistory = (scenarioName, projectName, endpointName, itemId, environment) => {
  return {
    text: `
    SELECT * FROM (SELECT jsonb_array_elements(stats) as labels, item_id,
    its.start_time, overview->'maxVu' as max_vu FROM jtl.item_stat as st
    LEFT JOIN jtl.items as its ON its.id = st.item_id
    LEFT JOIN jtl.scenario as sc ON sc.id = its.scenario_id
    LEFT JOIN jtl.projects as pr ON pr.id = sc.project_id
    WHERE sc.name = $1
    AND pr.project_name = $2
    AND environment = $5
    ORDER BY its.start_time DESC) as stats
    WHERE labels->>'label' = $3
    AND start_time <= (SELECT start_time FROM jtl.items WHERE id = $4)
    LIMIT 50;`,
    values: [scenarioName, projectName, endpointName, itemId, environment]
  };
};

export const getLabelHistoryForVu = (scenarioName, projectName, endpointName, itemId, environment, vu) => {
  return {
    text: `
    SELECT * FROM (SELECT jsonb_array_elements(stats) as labels, item_id,
    its.start_time, overview->'maxVu' as max_vu FROM jtl.item_stat as st
    LEFT JOIN jtl.items as its ON its.id = st.item_id
    LEFT JOIN jtl.scenario as sc ON sc.id = its.scenario_id
    LEFT JOIN jtl.projects as pr ON pr.id = sc.project_id
    WHERE sc.name = $1
    AND pr.project_name = $2
    AND environment = $5
    ORDER BY its.start_time DESC) as stats
    WHERE labels->>'label' = $3
    AND start_time <= (SELECT start_time FROM jtl.items WHERE id = $4)
    AND max_vu::integer = $6
    LIMIT 50;`,
    values: [scenarioName, projectName, endpointName, itemId, environment, vu]
  };
};

export const getMaxVuForLabel = (scenarioName, projectName, endpointName, itemId, environment) => {
  return {
    text: `
    SELECT DISTINCT max_vu as "maxVu", count(*) FROM (SELECT jsonb_array_elements(stats) as labels, item_id,
    its.start_time, overview->'maxVu' as max_vu FROM jtl.item_stat as st
    LEFT JOIN jtl.items as its ON its.id = st.item_id
    LEFT JOIN jtl.scenario as sc ON sc.id = its.scenario_id
    LEFT JOIN jtl.projects as pr ON pr.id = sc.project_id
    WHERE sc.name = $1
    AND pr.project_name = $2
    AND environment = $5
    ORDER BY its.start_time DESC) as stats
    WHERE labels->>'label' = $3
    AND start_time <= (SELECT start_time FROM jtl.items WHERE id = $4)
    GROUP BY stats.max_vu;`,
    values: [scenarioName, projectName, endpointName, itemId, environment]
  };
};
