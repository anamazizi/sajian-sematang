// lib/monitoring/audit-logger.ts
// Sensitive Action Logging for Production Monitoring (Phase 9)
// Master Prompt Section 58: AUDIT LOG & Section 111: MONITORING & LOGGING

export type AuditAction = 
  | 'ROLE_CHANGE'
  | 'SELLER_PAYMENT'
  | 'STOCK_CORRECTION'
  | 'PRICE_ADJUSTMENT'
  | 'ORDER_STATUS_CHANGE'
  | 'PRODUCT_CREATE'
  | 'PRODUCT_UPDATE'
  | 'PRODUCT_DELETE'
  | 'USER_CREATE'
  | 'USER_UPDATE'
  | 'PAYMENT_ADJUSTMENT'
  | 'DELIVERY_FEE_ADJUSTMENT'
  | 'SECURITY_ERROR';

export interface AuditLogEntry {
  actor_id: string;
  actor_role: string;
  action: AuditAction;
  entity_type: string;
  entity_id: string;
  old_value?: any;
  new_value?: any;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Log sensitive actions (simplified version for Phase 9)
 * In production, would integrate with Supabase audit_logs table
 */
export async function logSensitiveAction(entry: AuditLogEntry): Promise<{ success: boolean; error?: any }> {
  try {
    // Sanitize sensitive data before logging
    const sanitizedEntry = sanitizeSensitiveData(entry);
    
    // For now, log to console with clear markers
    // In production, would insert into audit_logs table
    console.log('[AUDIT_LOG]', {
      ...sanitizedEntry,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    });
    
    return { success: true };
  } catch (error) {
    console.error('[AUDIT_LOG_FAILURE]', error);
    return { success: false, error };
  }
}

/**
 * Sanitize sensitive data to prevent PII exposure in logs
 */
function sanitizeSensitiveData(entry: AuditLogEntry): AuditLogEntry {
  const { old_value, new_value, entity_type, ...rest } = entry;
  
  let sanitizedOldValue = old_value;
  let sanitizedNewValue = new_value;
  
  // Handle different entity types with different sanitization rules
  switch (entity_type) {
    case 'user':
      // Never log full user data
      sanitizedOldValue = '[USER_DATA_REDACTED]';
      sanitizedNewValue = '[USER_DATA_REDACTED]';
      break;
      
    case 'payment':
      // Mask payment details
      if (old_value && typeof old_value === 'object') {
        const { card_number, cvv, ...safeOld } = old_value;
        sanitizedOldValue = { ...safeOld, card_number: '[REDACTED]', cvv: '[REDACTED]' };
      }
      if (new_value && typeof new_value === 'object') {
        const { card_number, cvv, ...safeNew } = new_value;
        sanitizedNewValue = { ...safeNew, card_number: '[REDACTED]', cvv: '[REDACTED]' };
      }
      break;
      
    case 'customer_address':
      // Partially mask addresses
      if (typeof old_value === 'string') {
        sanitizedOldValue = maskAddress(old_value);
      }
      if (typeof new_value === 'string') {
        sanitizedNewValue = maskAddress(new_value);
      }
      break;
      
    default:
      // For other types, limit length for safety
      if (old_value && typeof old_value === 'string' && old_value.length > 100) {
        sanitizedOldValue = old_value.substring(0, 100) + '...';
      }
      if (new_value && typeof new_value === 'string' && new_value.length > 100) {
        sanitizedNewValue = new_value.substring(0, 100) + '...';
      }
  }
  
  return {
    ...rest,
    entity_type,
    old_value: sanitizedOldValue,
    new_value: sanitizedNewValue,
  };
}

/**
 * Mask sensitive parts of addresses
 */
function maskAddress(address: string): string {
  const parts = address.split(',');
  if (parts.length <= 1) return '[ADDRESS_REDACTED]';
  return `${parts[0]}, [DETAILS_REDACTED]`;
}

/**
 * Helper functions for common audit actions
 */
export const auditLogger = {
  logRoleChange: async (
    actorId: string,
    actorRole: string,
    userId: string,
    oldRole: string,
    newRole: string,
    reason?: string
  ) => {
    return logSensitiveAction({
      actor_id: actorId,
      actor_role: actorRole,
      action: 'ROLE_CHANGE',
      entity_type: 'user',
      entity_id: userId,
      old_value: oldRole,
      new_value: newRole,
      reason,
    });
  },
  
  logStockCorrection: async (
    actorId: string,
    actorRole: string,
    productId: string,
    oldQuantity: number,
    newQuantity: number,
    reason: string
  ) => {
    return logSensitiveAction({
      actor_id: actorId,
      actor_role: actorRole,
      action: 'STOCK_CORRECTION',
      entity_type: 'product',
      entity_id: productId,
      old_value: oldQuantity,
      new_value: newQuantity,
      reason,
    });
  },
  
  logOrderStatusChange: async (
    actorId: string,
    actorRole: string,
    orderId: string,
    oldStatus: string,
    newStatus: string
  ) => {
    return logSensitiveAction({
      actor_id: actorId,
      actor_role: actorRole,
      action: 'ORDER_STATUS_CHANGE',
      entity_type: 'order',
      entity_id: orderId,
      old_value: oldStatus,
      new_value: newStatus,
      reason: 'Order status updated',
    });
  },
};

/**
 * Vercel logging configuration for production
 */
export const vercelLogging = {
  config: {
    enableDetailedLogs: true,
    logLevel: 'info',
    sensitiveDataMasking: true,
  },
  
  instructions: `
  ## Vercel Production Logging Setup
  
  1. Enable Log Drains (Vercel Dashboard → Settings → Log Drains)
  2. Configure environment variables:
     - SENTRY_DSN: For error tracking
     - LOG_LEVEL: info/warn/error
  3. Never log full user data
  4. Mask PII in all logs
  5. Separate audit logs from application logs
  `,
};