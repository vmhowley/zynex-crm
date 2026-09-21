-- ============================================================
-- Recoverable sales workspace reset
--
-- Closes active conversations and marks open deals as lost without
-- deleting contacts, messages, pipelines, or history. The function is
-- intentionally admin-only and performs both updates in one transaction.
-- ============================================================

CREATE OR REPLACE FUNCTION archive_sales_workspace(target_account_id UUID)
RETURNS TABLE(conversations_archived BIGINT, deals_archived BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_account_member(target_account_id, 'admin') THEN
    RAISE EXCEPTION 'admin role required' USING ERRCODE = '42501';
  END IF;

  UPDATE conversations
  SET status = 'closed', updated_at = NOW()
  WHERE account_id = target_account_id
    AND status IN ('open', 'pending');
  GET DIAGNOSTICS conversations_archived = ROW_COUNT;

  UPDATE deals
  SET status = 'lost', updated_at = NOW()
  WHERE account_id = target_account_id
    AND status = 'open';
  GET DIAGNOSTICS deals_archived = ROW_COUNT;

  RETURN NEXT;
END;
$$;

ALTER FUNCTION archive_sales_workspace(UUID) OWNER TO postgres;
REVOKE ALL ON FUNCTION archive_sales_workspace(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION archive_sales_workspace(UUID) TO authenticated, service_role;

