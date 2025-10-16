const db = require("../config/database");

const getStatusIdByName = async (statusName) => {
  const query = "SELECT id FROM other_component_statuses WHERE name = $1";
  const { rows } = await db.query(query, [statusName]);
  return rows[0]?.id;
};

const getProjectsWithOtherComponents = async () => {
  const query = `
    SELECT 
      p.id AS project_id, 
      p.project_code, 
      p.name AS project_name,
      oc.id AS component_id,
      oc.name AS component_name,
      oc.total_quantity,
      ocst.status_id,
      ocst.quantity,
      ocs.name AS status_name
    FROM 
      projects p
    INNER JOIN 
      other_components oc ON p.id = oc.project_id
    INNER JOIN 
      other_component_status_tracking ocst ON oc.id = ocst.other_component_id
    INNER JOIN 
      other_component_statuses ocs ON ocst.status_id = ocs.id
    ORDER BY 
      p.project_code, oc.name, ocs.name
  `;

  const { rows } = await db.query(query);
  return rows;
};

// const updateOtherComponentStatus = async (componentId, fromStatus, toStatus, quantity, userId) => {
//   const client = await db.getClient();

//   try {
//     await client.query("BEGIN");

//     const fromStatusId = await getStatusIdByName(fromStatus);
//     const toStatusId = await getStatusIdByName(toStatus);

//     // 1. ตรวจสอบความถูกต้องของการเปลี่ยนสถานะ
//     const validTransitions = {
//       'planning': ['manufactured', 'rejected'],
//       'manufactured': ['transported', 'rejected', 'planning'],
//       'transported': ['manufactured', 'rejected'],
//       'rejected': ['planning']
//     };
//     if (!validTransitions[fromStatus]?.includes(toStatus)) {
//       throw new Error(`Invalid status transition from ${fromStatus} to ${toStatus}`);
//     }

//     // 2. ดึงข้อมูลปัจจุบันของ component
//     const { rows: [currentComponent] } = await client.query(
//       "SELECT total_quantity FROM other_components WHERE id = $1",
//       [componentId]
//     );
//     const { rows: currentStatuses } = await client.query(
//       `SELECT ocs.name, ocst.quantity 
//        FROM other_component_status_tracking ocst 
//        JOIN other_component_statuses ocs ON ocst.status_id = ocs.id 
//        WHERE ocst.other_component_id = $1`,
//       [componentId]
//     );
//     const currentStatusMap = currentStatuses.reduce((acc, { name, quantity }) => {
//       acc[name] = parseInt(quantity);
//       return acc;
//     }, {});

//     // 3. ตรวจสอบจำนวนก่อนการอัพเดท
//     if (currentStatusMap[fromStatus] < quantity) {
//       throw new Error(`Not enough quantity in ${fromStatus} status`);
//     }

//     // 4. อัพเดทจำนวนตามสถานะ
//     if (fromStatus === 'manufactured' && toStatus === 'transported') {
//       // กรณีพิเศษ: ไม่ลดจำนวนจาก manufactured เมื่อเปลี่ยนเป็น transported
//       await client.query(
//         `INSERT INTO other_component_status_tracking (other_component_id, status_id, quantity, created_by)
//          VALUES ($1, $2, $3, $4)
//          ON CONFLICT (other_component_id, status_id) 
//          DO UPDATE SET quantity = other_component_status_tracking.quantity + $3`,
//         [componentId, toStatusId, quantity, userId]
//       );
//     } else if (fromStatus === 'transported' && toStatus === 'manufactured') {
//       // กรณีพิเศษ: ไม่เพิ่มจำนวนใน manufactured เมื่อเปลี่ยนจาก transported
//       await client.query(
//         `UPDATE other_component_status_tracking
//          SET quantity = quantity - $1
//          WHERE other_component_id = $2 AND status_id = $3`,
//         [quantity, componentId, fromStatusId]
//       );
//     } else if (fromStatus === 'manufactured' && (toStatus === 'rejected' || toStatus === 'planning')) {
//       // กรณีพิเศษ: ลดจำนวนจาก manufactured และเพิ่มจำนวนใน rejected หรือ planning
//       await client.query(
//         `UPDATE other_component_status_tracking
//          SET quantity = GREATEST(quantity - $1, 0)
//          WHERE other_component_id = $2 AND status_id = $3`,
//         [quantity, componentId, fromStatusId]
//       );
//       await client.query(
//         `INSERT INTO other_component_status_tracking (other_component_id, status_id, quantity, created_by)
//          VALUES ($1, $2, $3, $4)
//          ON CONFLICT (other_component_id, status_id) 
//          DO UPDATE SET quantity = other_component_status_tracking.quantity + $3`,
//         [componentId, toStatusId, quantity, userId]
//       );
//     } else {
//       // กรณีทั่วไป
//       await client.query(
//         `UPDATE other_component_status_tracking
//          SET quantity = GREATEST(quantity - $1, 0)
//          WHERE other_component_id = $2 AND status_id = $3`,
//         [quantity, componentId, fromStatusId]
//       );
//       await client.query(
//         `INSERT INTO other_component_status_tracking (other_component_id, status_id, quantity, created_by)
//          VALUES ($1, $2, $3, $4)
//          ON CONFLICT (other_component_id, status_id) 
//          DO UPDATE SET quantity = other_component_status_tracking.quantity + $3`,
//         [componentId, toStatusId, quantity, userId]
//       );
//     }

//     // 5. บันทึกประวัติการเปลี่ยนสถานะ
//     await client.query(
//       `INSERT INTO other_component_status_history 
//        (other_component_id, from_status_id, to_status_id, quantity, created_by)
//        VALUES ($1, $2, $3, $4, $5)`,
//       [componentId, fromStatusId, toStatusId, quantity, userId]
//     );

//     // 6. ดึงข้อมูลที่อัพเดทแล้ว
//     const { rows: updatedStatuses } = await client.query(
//       `SELECT ocs.name, ocst.quantity 
//        FROM other_component_status_tracking ocst 
//        JOIN other_component_statuses ocs ON ocst.status_id = ocs.id 
//        WHERE ocst.other_component_id = $1`,
//       [componentId]
//     );

//     const statusesWithQuantity = updatedStatuses.reduce((acc, { name, quantity }) => {
//       acc[name] = parseInt(quantity);
//       return acc;
//     }, {});

//     // คำนวณ percentage
//     const percentages = {};
//     for (const [status, statusQuantity] of Object.entries(statusesWithQuantity)) {
//       percentages[status] = currentComponent.total_quantity > 0 
//         ? (statusQuantity / currentComponent.total_quantity) * 100 
//         : 0;
//     }

//     await client.query("COMMIT");

//     // 7. Return ข้อมูล
//     return {
//       id: componentId,
//       statuses: statusesWithQuantity,
//       total: currentComponent.total_quantity,
//       percentages: percentages,
//       _lastUpdate: {
//         fromStatus,
//         toStatus,
//         quantity,
//         timestamp: new Date().toISOString()
//       }
//     };

//   } catch (error) {
//     await client.query("ROLLBACK");
//     console.error('Error in updateOtherComponentStatus:', error);
//     throw error;
//   } finally {
//     client.release();
//   }
// };


const validateStatusUpdate = (currentStatusMap, fromStatus, toStatus, quantity, totalQuantity) => {
  // 1. ตรวจสอบการเปลี่ยนสถานะที่อนุญาต
  const validTransitions = {
    'planning': ['manufactured', 'rejected'],
    'manufactured': ['transported', 'rejected', 'planning'],
    'transported': ['rejected'],
    'rejected': ['planning']
  };

  if (!validTransitions[fromStatus]?.includes(toStatus)) {
    throw new Error(`ไม่สามารถเปลี่ยนสถานะจาก ${fromStatus} ไปยัง ${toStatus} ได้โดยตรง`);
  }

  // 2. ตรวจสอบจำนวนในสถานะต้นทาง
  const availableQuantity = currentStatusMap[fromStatus] || 0;
  if (availableQuantity < quantity) {
    throw new Error(`จำนวนในสถานะ ${fromStatus} ไม่เพียงพอ (มี: ${availableQuantity}, ต้องการ: ${quantity})`);
  }

  // 3. กรณีพิเศษสำหรับการขนส่ง
  if (toStatus === 'transported') {
    const currentTransported = currentStatusMap['transported'] || 0;
    const newTransported = currentTransported + quantity;
    
    if (newTransported > totalQuantity) {
      throw new Error(`จำนวนที่ขนส่งรวม (${newTransported}) ต้องไม่เกินจำนวนรวม (${totalQuantity})`);
    }
  }

  // 4. จัดการกรณี rejected และ planning
  const currentTransported = currentStatusMap['transported'] || 0;
  const currentPlanning = currentStatusMap['planning'] || 0;
  const currentRejected = currentStatusMap['rejected'] || 0;
  
  let newPlanning = currentPlanning;
  let newTransported = currentTransported;

  // ปรับ planning และ transported ตามการเปลี่ยนแปลง
  if (fromStatus === 'transported') {
    newTransported -= quantity;
    if (toStatus === 'rejected') {
      // เมื่อ reject จาก transported ให้เพิ่ม planning อัตโนมัติ
      newPlanning += quantity;
    }
  }
  
  if (toStatus === 'transported') {
    newTransported += quantity;
  }

  if (fromStatus === 'planning') {
    newPlanning -= quantity;
  }
  
  if (toStatus === 'planning') {
    newPlanning += quantity;
  }

  // ตรวจสอบผลรวมเมื่อมีการเปลี่ยนแปลง transported หรือ planning
  if ((fromStatus === 'transported' || toStatus === 'transported' || 
       fromStatus === 'planning' || toStatus === 'planning') &&
      fromStatus !== 'manufactured') { // ยกเว้นกรณี manufactured -> transported
    
    // อนุญาตให้ planning + transported น้อยกว่า total ได้ในกรณีที่มี rejected
    if (newPlanning + newTransported > totalQuantity) {
      throw new Error(`ผลรวมของ planning (${newPlanning}) และ transported (${newTransported}) ต้องไม่เกินจำนวนรวม (${totalQuantity})`);
    }
  }
};

// ฟังก์ชันอัพเดทสถานะ
const updateOtherComponentStatus = async (componentId, fromStatus, toStatus, quantity, userId) => {
  const client = await db.getClient();

  try {
    await client.query("BEGIN");

    // ดึง status IDs
    const fromStatusId = await getStatusIdByName(fromStatus);
    const toStatusId = await getStatusIdByName(toStatus);
    const planningStatusId = await getStatusIdByName('planning');

    // ดึงข้อมูลปัจจุบัน
    const { rows: [component] } = await client.query(
      "SELECT total_quantity FROM other_components WHERE id = $1",
      [componentId]
    );

    const { rows: currentStatuses } = await client.query(
      `SELECT ocs.name, ocst.quantity 
       FROM other_component_status_tracking ocst 
       JOIN other_component_statuses ocs ON ocst.status_id = ocs.id 
       WHERE ocst.other_component_id = $1`,
      [componentId]
    );

    const currentStatusMap = currentStatuses.reduce((acc, { name, quantity }) => {
      acc[name] = parseInt(quantity);
      return acc;
    }, {});

    // Validate
    validateStatusUpdate(
      currentStatusMap,
      fromStatus,
      toStatus,
      quantity,
      component.total_quantity
    );

    const updates = [];

    // จัดการการอัพเดทตามกรณีต่างๆ
    if (fromStatus === 'transported' && toStatus === 'rejected') {
      // ลด transported
      updates.push({
        query: `UPDATE other_component_status_tracking
                SET quantity = quantity - $1
                WHERE other_component_id = $2 AND status_id = $3`,
        params: [quantity, componentId, fromStatusId]
      });

      // เพิ่ม rejected
      updates.push({
        query: `INSERT INTO other_component_status_tracking 
                (other_component_id, status_id, quantity, created_by)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (other_component_id, status_id) 
                DO UPDATE SET quantity = other_component_status_tracking.quantity + $3`,
        params: [componentId, toStatusId, quantity, userId]
      });

      // เพิ่ม planning อัตโนมัติ
      updates.push({
        query: `INSERT INTO other_component_status_tracking 
                (other_component_id, status_id, quantity, created_by)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (other_component_id, status_id) 
                DO UPDATE SET quantity = other_component_status_tracking.quantity + $3`,
        params: [componentId, planningStatusId, quantity, userId]
      });
    } else {
      // กรณีทั่วไป
      if (fromStatus !== 'manufactured' || toStatus !== 'transported') {
        updates.push({
          query: `UPDATE other_component_status_tracking
                  SET quantity = quantity - $1
                  WHERE other_component_id = $2 AND status_id = $3`,
          params: [quantity, componentId, fromStatusId]
        });
      }

      updates.push({
        query: `INSERT INTO other_component_status_tracking 
                (other_component_id, status_id, quantity, created_by)
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (other_component_id, status_id) 
                DO UPDATE SET quantity = other_component_status_tracking.quantity + $3`,
        params: [componentId, toStatusId, quantity, userId]
      });
    }

    // Execute all updates
    for (const update of updates) {
      await client.query(update.query, update.params);
    }

    // บันทึกประวัติ
    await client.query(
      `INSERT INTO other_component_status_history 
       (other_component_id, from_status_id, to_status_id, quantity, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [componentId, fromStatusId, toStatusId, quantity, userId]
    );

    // ดึงข้อมูลที่อัพเดทแล้ว
    const { rows: updatedStatuses } = await client.query(
      `SELECT ocs.name, ocst.quantity 
       FROM other_component_status_tracking ocst 
       JOIN other_component_statuses ocs ON ocst.status_id = ocs.id 
       WHERE ocst.other_component_id = $1`,
      [componentId]
    );

    const statusesWithQuantity = updatedStatuses.reduce((acc, { name, quantity }) => {
      acc[name] = parseInt(quantity);
      return acc;
    }, {});

    await client.query("COMMIT");

    return {
      id: componentId,
      statuses: statusesWithQuantity,
      total: component.total_quantity,
      _lastUpdate: {
        fromStatus,
        toStatus,
        quantity,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    await client.query("ROLLBACK");
    console.error('Error in updateOtherComponentStatus:', error);
    throw error;
  } finally {
    client.release();
  }
};

const getOtherComponentStatusHistory = async (componentId) => {
  const query = `
    SELECT 
      h.id, 
      fs.name AS from_status, 
      ts.name AS to_status, 
      h.quantity, 
      h.created_at, 
      u.username AS created_by
    FROM 
      other_component_status_history h
    JOIN 
      other_component_statuses fs ON h.from_status_id = fs.id
    JOIN 
      other_component_statuses ts ON h.to_status_id = ts.id
    JOIN 
      users u ON h.created_by = u.id
    WHERE 
      h.other_component_id = $1
    ORDER BY 
      h.created_at DESC
  `;

  try {
    const { rows } = await db.query(query, [componentId]);
    return rows;
  } catch (error) {
    console.error('Error in getOtherComponentStatusHistory:', error);
    throw error;
  }
};

const createOtherComponent = async (data) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // Create other component
    const { rows: [newComponent] } = await client.query(`
      INSERT INTO other_components 
      (project_id, name, width, height, thickness, total_quantity, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [data.project_id, data.name, data.width, data.height, data.thickness, data.total_quantity, data.created_by]);

    // Add planning status
    const planningStatusId = await getStatusIdByName("planning");
    await client.query(
      "INSERT INTO other_component_status_tracking (other_component_id, status_id, quantity, created_by) VALUES ($1, $2, $3, $4)",
      [newComponent.id, planningStatusId, newComponent.total_quantity, newComponent.created_by]
    );

    // Add initial status history entry
    await client.query(
      `INSERT INTO other_component_status_history 
       (other_component_id, from_status_id, to_status_id, quantity, created_by)
       VALUES ($1, $2, $2, $3, $4)`,
      [newComponent.id, planningStatusId, newComponent.total_quantity, newComponent.created_by]
    );

    // Fetch status data
    const { rows: [status] } = await client.query(
      "SELECT ocs.name, ocst.quantity FROM other_component_status_tracking ocst JOIN other_component_statuses ocs ON ocst.status_id = ocs.id WHERE ocst.other_component_id = $1",
      [newComponent.id]
    );

    await client.query("COMMIT");

    return { ...newComponent, status: { [status.name]: status.quantity } };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error('Error in createOtherComponent:', error);
    throw error;
  } finally {
    client.release();
  }
};

const updateOtherComponentDetails = async (componentId, updateData) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    // อัปเดตข้อมูลพื้นฐานของ component
    const { rows: [updatedComponent] } = await client.query(`
      UPDATE other_components
      SET name = $1, width = $2, height = $3, thickness = $4, total_quantity = $5, updated_at = CURRENT_TIMESTAMP, updated_by = $6
      WHERE id = $7
      RETURNING *
    `, [updateData.name, updateData.width, updateData.height, updateData.thickness, updateData.total_quantity, updateData.updated_by, componentId]);

    // ถ้ามีการเปลี่ยนแปลง total_quantity ให้รีเซ็ตสถานะ
    if (updateData.resetStatuses) {
      // ลบสถานะทั้งหมดของ component นี้
      await client.query(`
        DELETE FROM other_component_status_tracking
        WHERE other_component_id = $1
      `, [componentId]);

      // เพิ่มสถานะ 'planning' ใหม่ด้วยจำนวนทั้งหมด
      const planningStatusId = await getStatusIdByName('planning');
      await client.query(`
        INSERT INTO other_component_status_tracking (other_component_id, status_id, quantity, created_by)
        VALUES ($1, $2, $3, $4)
      `, [componentId, planningStatusId, updateData.total_quantity, updateData.updated_by]);
    }

    // ดึงข้อมูลสถานะล่าสุด
    const { rows: statuses } = await client.query(`
      SELECT ocs.name, ocst.quantity 
      FROM other_component_status_tracking ocst 
      JOIN other_component_statuses ocs ON ocst.status_id = ocs.id 
      WHERE ocst.other_component_id = $1
    `, [componentId]);

    await client.query("COMMIT");

    return {
      ...updatedComponent,
      statuses: statuses.reduce((acc, status) => ({ ...acc, [status.name]: status.quantity }), {})
    };
  } catch (error) {
    await client.query("ROLLBACK");
    console.error('Error in updateOtherComponentDetails:', error);
    throw error;
  } finally {
    client.release();
  }
};


const deleteOtherComponentById = async (componentId) => {
  const client = await db.getClient();
  try {
    await client.query("BEGIN");

    await client.query("DELETE FROM other_component_status_tracking WHERE other_component_id = $1", [componentId]);
    await client.query("DELETE FROM other_components WHERE id = $1", [componentId]);

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error('Error in deleteOtherComponentById:', error);
    throw error;
  } finally {
    client.release();
  }
};

const getOtherComponentsByProjectId = async (projectId) => {
  const query = `
    SELECT 
      oc.id, oc.name, oc.width, oc.height, oc.thickness, oc.total_quantity,
      json_object_agg(ocs.name, ocst.quantity) as statuses
    FROM 
      other_components oc
    LEFT JOIN 
      other_component_status_tracking ocst ON oc.id = ocst.other_component_id
    LEFT JOIN 
      other_component_statuses ocs ON ocst.status_id = ocs.id
    WHERE 
      oc.project_id = $1
    GROUP BY 
      oc.id
  `;

  const { rows } = await db.query(query, [projectId]);
  return rows;
};

module.exports = {
  getProjectsWithOtherComponents,
  updateOtherComponentStatus,
  createOtherComponent,
  getStatusIdByName,
  updateOtherComponentDetails,
  deleteOtherComponentById,
  getOtherComponentsByProjectId,
};