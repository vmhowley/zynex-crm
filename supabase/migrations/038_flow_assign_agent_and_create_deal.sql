-- ============================================================
-- 038_flow_assign_agent_and_create_deal.sql
--
-- Agrega nodos assign_agent y create_deal al flow
-- ============================================================

ALTER TABLE flow_nodes
  DROP CONSTRAINT IF EXISTS flow_nodes_node_type_check;

ALTER TABLE flow_nodes
  ADD CONSTRAINT flow_nodes_node_type_check
  CHECK (node_type IN (
    'start',
    'send_buttons',
    'send_list',
    'send_message',
    'send_media',
    'collect_input',
    'condition',
    'set_tag',
    'handoff',
    'http_fetch',
    'assign_agent',
    'create_deal',
    'end'
  ));
