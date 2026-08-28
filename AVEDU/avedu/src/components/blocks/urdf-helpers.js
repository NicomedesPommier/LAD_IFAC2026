// components/blocks/urdf-helpers.js
// Helpers puros para serializar URDF y derivar XML desde el grafo (@xyflow/react)

/** Escapa caracteres XML */
export const esc = (s = "") =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");

/** Formatea vectores xyz/rpy a "x y z" */
export const fmtVec = (v) => (Array.isArray(v) ? v.join(" ") : String(v ?? ""));

/** <visual> ... </visual> */
export function visualToXml(v) {
  if (!v) return "";
  const origin = v.origin
    ? `<origin xyz="${esc(fmtVec(v.origin.xyz))}" rpy="${esc(fmtVec(v.origin.rpy))}"/>`
    : "";
  let geom = "";
  if (v.geometry?.type === "mesh") {
    const scale = v.geometry.scale ? ` scale="${esc(fmtVec(v.geometry.scale))}"` : "";
    geom = `<geometry><mesh filename="${esc(v.geometry.filename || "")}"${scale}/></geometry>`;
  } else if (v.geometry?.type === "box") {
    geom = `<geometry><box size="${esc(fmtVec(v.geometry.size || [1, 1, 1]))}"/></geometry>`;
  } else if (v.geometry?.type === "cylinder") {
    geom = `<geometry><cylinder radius="${esc(v.geometry.radius || 0.05)}" length="${esc(
      v.geometry.length || 0.1
    )}"/></geometry>`;
  } else if (v.geometry?.type === "sphere") {
    geom = `<geometry><sphere radius="${esc(v.geometry.radius || 0.05)}"/></geometry>`;
  }
  const material = v.material?.name ? `<material name="${esc(v.material.name)}"/>` : "";
  return `<visual>${origin}${geom}${material}</visual>`;
}

/** <collision> ... </collision> */
export function collisionToXml(c) {
  if (!c) return "";
  const origin = c.origin
    ? `<origin xyz="${esc(fmtVec(c.origin.xyz))}" rpy="${esc(fmtVec(c.origin.rpy))}"/>`
    : "";
  let geom = "";
  if (c.geometry?.type === "mesh") {
    const scale = c.geometry.scale ? ` scale="${esc(fmtVec(c.geometry.scale))}"` : "";
    geom = `<geometry><mesh filename="${esc(c.geometry.filename || "")}"${scale}/></geometry>`;
  } else if (c.geometry?.type === "box") {
    geom = `<geometry><box size="${esc(fmtVec(c.geometry.size || [1, 1, 1]))}"/></geometry>`;
  } else if (c.geometry?.type === "cylinder") {
    geom = `<geometry><cylinder radius="${esc(c.geometry.radius || 0.05)}" length="${esc(
      c.geometry.length || 0.1
    )}"/></geometry>`;
  } else if (c.geometry?.type === "sphere") {
    geom = `<geometry><sphere radius="${esc(c.geometry.radius || 0.05)}"/></geometry>`;
  }
  return `<collision>${origin}${geom}</collision>`;
}

/** <inertial> ... </inertial> */
export function inertialToXml(i) {
  if (!i) return "";
  const origin = i.origin
    ? `<origin xyz="${esc(fmtVec(i.origin.xyz))}" rpy="${esc(fmtVec(i.origin.rpy))}"/>`
    : "";
  const mass =
    i.mass || i.mass === 0 ? `<mass value="${esc(i.mass)}"/>` : "";
  const I = i.inertia || {};
  const inertia =
    I.ixx || I.iyy || I.izz
      ? `<inertia ixx="${esc(I.ixx || 0)}" ixy="${esc(I.ixy || 0)}" ixz="${esc(
          I.ixz || 0
        )}" iyy="${esc(I.iyy || 0)}" iyz="${esc(I.iyz || 0)}" izz="${esc(I.izz || 0)}"/>`
      : "";
  return `<inertial>${origin}${mass}${inertia}</inertial>`;
}

/** <link> ... </link> */
export function linkToXml(l) {
  if (!l?.name) return "";
  const visuals = Array.isArray(l.visuals) ? l.visuals.map(visualToXml).join("") : "";
  const collisions = Array.isArray(l.collisions)
    ? l.collisions.map(collisionToXml).join("")
    : "";
  const inertial = inertialToXml(l.inertial);
  return `<link name="${esc(l.name)}">${inertial}${visuals}${collisions}</link>`;
}

/** <joint> ... </joint> */
export function jointToXml(j) {
  if (!j?.name || !j.parent || !j.child || !j.type) return "";
  const origin = j.origin
    ? `<origin xyz="${esc(fmtVec(j.origin.xyz))}" rpy="${esc(fmtVec(j.origin.rpy))}"/>`
    : "";
  const axis = j.axis ? `<axis xyz="${esc(fmtVec(j.axis.xyz))}"/>` : "";

  // Add limit element for movable joints
  let limit = "";
  if (j.limit && (j.type === "revolute" || j.type === "prismatic")) {
    const lower = j.limit.lower !== undefined ? j.limit.lower : (j.type === "prismatic" ? -1 : -3.14159);
    const upper = j.limit.upper !== undefined ? j.limit.upper : (j.type === "prismatic" ? 1 : 3.14159);
    const effort = j.limit.effort !== undefined ? j.limit.effort : 100;
    const velocity = j.limit.velocity !== undefined ? j.limit.velocity : 1;
    limit = `<limit lower="${esc(lower)}" upper="${esc(upper)}" effort="${esc(effort)}" velocity="${esc(velocity)}"/>`;
  }

  return `<joint name="${esc(j.name)}" type="${esc(j.type)}">${origin}<parent link="${esc(
    j.parent
  )}"/><child link="${esc(j.child)}"/>${axis}${limit}</joint>`;
}

/** Documento <robot>… con links y joints */
export function robotToXml(name, links = [], joints = []) {
  const linkXml = links.map(linkToXml).filter(Boolean).join("\n");
  const jointXml = joints.map(jointToXml).filter(Boolean).join("\n");
  return `<?xml version="1.0"?>\n<robot name="${esc(name || "my_robot")}">\n${linkXml}\n${jointXml}\n</robot>`;
}

/* ---------- Derivadas desde el grafo de React Flow ---------- */

/**
 * Resuelve los componentes conectados a un nodo LinkV2
 * (inertial, visual[], collision[])
 */
export function resolveLinkV2Components(linkNode, nodes, edges) {
  const linkId = linkNode.id;
  const incoming = edges.filter((e) => e.target === linkId);

  // Inertial (single)
  const inertialEdge = incoming.find((e) => e.targetHandle === "inertial");
  const inertialNode = inertialEdge ? nodes.find((n) => n.id === inertialEdge.source) : null;
  const inertial = inertialNode?.data || null;

  // Visuals (multiple)
  const visualEdges = incoming.filter((e) => e.targetHandle === "visual");
  const visuals = visualEdges
    .map((e) => nodes.find((n) => n.id === e.source)?.data)
    .filter(Boolean);

  // Collisions (multiple)
  const collisionEdges = incoming.filter((e) => e.targetHandle === "collision");
  const collisions = collisionEdges
    .map((e) => nodes.find((n) => n.id === e.source)?.data)
    .filter(Boolean);

  return {
    name: linkNode.data?.name || "",
    inertial,
    visuals,
    collisions
  };
}

/**
 * Resuelve los componentes de un nodo Assembly
 * (links[], joints[])
 */
export function resolveAssemblyComponents(assemblyNode, nodes, edges) {
  const assemblyId = assemblyNode.id;
  const incoming = edges.filter((e) => e.target === assemblyId);

  // Links
  const linkEdges = incoming.filter((e) => e.targetHandle === "links");
  const links = linkEdges
    .map((e) => {
      const linkNode = nodes.find((n) => n.id === e.source);
      if (!linkNode) return null;
      // If it's a V2 link, resolve its components
      if (linkNode.type === "urdfLinkV2") {
        return resolveLinkV2Components(linkNode, nodes, edges);
      }
      // Otherwise use its data directly
      return linkNode.data;
    })
    .filter(Boolean);

  // Joints
  const jointEdges = incoming.filter((e) => e.targetHandle === "joints");
  const joints = jointEdges
    .map((e) => nodes.find((n) => n.id === e.source)?.data)
    .filter(Boolean);

  return { links, joints };
}

/** Extrae del grafo los datos conectados al nodo urdfRobot */
export function computeRobotData(nodes, edges) {
  const robot = nodes.find((n) => n.type === "urdfRobot");
  if (!robot) return { robotId: null, links: [], joints: [], name: "my_robot" };

  const incoming = edges.filter((e) => e.target === robot.id);

  let allLinks = [];
  let allJoints = [];

  // Direct links (from urdfLink or urdfLinkV2)
  const directLinkEdges = incoming.filter((e) => e.targetHandle === "links");
  directLinkEdges.forEach((e) => {
    const linkNode = nodes.find((n) => n.id === e.source);
    if (!linkNode) return;
    if (linkNode.type === "urdfLinkV2") {
      allLinks.push(resolveLinkV2Components(linkNode, nodes, edges));
    } else {
      allLinks.push(linkNode.data);
    }
  });

  // Direct joints
  const directJointEdges = incoming.filter((e) => e.targetHandle === "joints");
  directJointEdges.forEach((e) => {
    const jointNode = nodes.find((n) => n.id === e.source);
    if (jointNode?.data) allJoints.push(jointNode.data);
  });

  // Assemblies (groups of links and joints)
  const assemblyEdges = incoming.filter((e) => e.targetHandle === "assemblies");
  assemblyEdges.forEach((e) => {
    const assemblyNode = nodes.find((n) => n.id === e.source);
    if (!assemblyNode) return;
    const { links, joints } = resolveAssemblyComponents(assemblyNode, nodes, edges);
    allLinks.push(...links);
    allJoints.push(...joints);
  });

  const name = robot.data?.name || "my_robot";
  return { robotId: robot.id, links: allLinks, joints: allJoints, name };
}

/** Genera el XML del robot actualmente conectado */
export function computeUrdfXml(nodes, edges) {
  const { robotId, links, joints, name } = computeRobotData(nodes, edges);
  if (!robotId) return { xml: "", robotId: null };
  const xml = robotToXml(name, links, joints);
  return { xml, robotId };
}

/**
 * Sincroniza el XML generado hacia:
 *  - el propio nodo urdfRobot (data.xml)
 *  - cualquier urdfPreview / urdfXmlPreview / urdfViewer / urdfControl en el grafo
 */
export function syncUrdfDerived(nodes, edges, setNodes) {
  const deriv = computeUrdfXml(nodes, edges);
  if (!deriv.robotId) return;
  const { xml, robotId } = deriv;

  setNodes(prev => {
    let changed = false;
    const next = prev.map(n => {
      const curr = n.data || {};
      const isTarget = (n.id === robotId) ||
                       (n.type === 'urdfPreview') ||
                       (n.type === 'urdfXmlPreview') ||
                       (n.type === 'urdfViewer') ||
                       (n.type === 'urdfControl');
      if (!isTarget) return n;

      if (curr.xml === xml) return n; // nada cambia
      changed = true;
      return { ...n, data: { ...curr, xml } };
    });

    return changed ? next : prev;
  });
}

/**
 * Sincroniza los estados de articulaciones desde nodos urdfControl hacia urdfViewer
 * que están conectados mediante edges
 */
export function syncJointStates(nodes, edges, setNodes) {
  // Find all urdfControl nodes with joint states
  const controlNodes = nodes.filter(n => n.type === 'urdfControl' && n.data?.jointStates);

  if (controlNodes.length === 0) return;

  setNodes(prev => {
    let changed = false;
    const next = prev.map(n => {
      // Only update urdfViewer nodes
      if (n.type !== 'urdfViewer') return n;

      // Find incoming edge from urdfControl to this viewer's jointStates handle
      const incomingEdge = edges.find(
        e => e.target === n.id && e.targetHandle === 'jointStates'
      );

      if (!incomingEdge) return n;

      // Find the source control node
      const sourceControl = controlNodes.find(c => c.id === incomingEdge.source);
      if (!sourceControl || !sourceControl.data?.jointStates) return n;

      const newJointStates = sourceControl.data.jointStates;
      const currentJointStates = n.data?.jointStates;

      // Check if joint states actually changed
      if (JSON.stringify(currentJointStates) === JSON.stringify(newJointStates)) {
        return n;
      }

      changed = true;
      return {
        ...n,
        data: {
          ...n.data,
          jointStates: newJointStates
        }
      };
    });

    return changed ? next : prev;
  });
}
