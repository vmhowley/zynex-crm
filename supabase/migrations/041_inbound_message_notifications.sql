-- ============================================================
-- 041_inbound_message_notifications.sql
-- Create an in-app/device-notification record for each customer message.
-- Assigned conversations notify their assignee; unassigned conversations
-- notify the account's operational users (owner, admin and agent).
-- ============================================================

ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('conversation_assigned', 'message_received'));

CREATE OR REPLACE FUNCTION notify_inbound_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation conversations%ROWTYPE;
  v_contact_name TEXT;
  v_body TEXT;
BEGIN
  IF NEW.sender_type <> 'customer' THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_conversation
  FROM conversations
  WHERE id = NEW.conversation_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(NULLIF(name, ''), phone) INTO v_contact_name
  FROM contacts
  WHERE id = v_conversation.contact_id;

  v_body := COALESCE(
    NULLIF(LEFT(TRIM(COALESCE(NEW.content_text, '')), 180), ''),
    'Te envió un mensaje multimedia'
  );

  INSERT INTO notifications (
    account_id, user_id, type, conversation_id, contact_id, title, body
  )
  SELECT
    v_conversation.account_id,
    p.user_id,
    'message_received',
    v_conversation.id,
    v_conversation.contact_id,
    'Nuevo mensaje de ' || COALESCE(v_contact_name, 'un contacto'),
    v_body
  FROM profiles p
  WHERE p.account_id = v_conversation.account_id
    AND p.account_role IN ('owner', 'admin', 'agent')
    AND (
      v_conversation.assigned_agent_id IS NULL
      OR p.user_id = v_conversation.assigned_agent_id
    );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Incoming WhatsApp processing must never fail because notifications do.
  RAISE WARNING 'Failed to create inbound message notification for message %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

ALTER FUNCTION notify_inbound_message() OWNER TO postgres;

DROP TRIGGER IF EXISTS on_inbound_message_notification ON messages;
CREATE TRIGGER on_inbound_message_notification
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_inbound_message();
