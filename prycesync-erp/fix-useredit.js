const fs=require('fs');
const p='D:/cursor-projects/facturacion/prycesync-erp/src/renderer/src/views/UserEditView.vue';
let s=fs.readFileSync(p,'utf8');
if(!/from '@\/services\/users'/.test(s)){
  s=s.replace(/(import\s*\{\s*useNotifications\s*\}\s*from\s*'@\/composables\/useNotifications')/,'$1\nimport { revokeSessions } from '\''@/services/users'\''');
}
s=s.replace(/let\s+pendingAction:[^\n]*/,'let pendingAction: null | '\''updateUser'\'' | '\''updateStatus'\'' | '\''revokeSessions'\'' = null');
const fn=`async function applyConfirmedChange() {\n  try {\n    if (pendingAction === 'updateUser' && user.value) {\n      isSaving.value = true\n      const updated = await users.updateUser(user.value.id, { name: form.value.name, role: form.value.role })\n      success('Usuario actualizado', 'Nombre/Rol actualizados correctamente')\n      showConfirm.value = false\n    } else if (pendingAction === 'updateStatus' && user.value) {\n      isSaving.value = true\n      const updated = await users.updateStatus(user.value.id, statusDraft.value)\n      success('Estado actualizado', \`Nuevo estado: ${updated.status}\`)\n      showConfirm.value = false\n    } else if (pendingAction === 'revokeSessions' && user.value) {\n      isSaving.value = true\n      const res = await revokeSessions(user.value.id)\n      success('Sesiones revocadas', res.message || 'Las sesiones activas han sido revocadas')\n      showConfirm.value = false\n    }\n  } catch (e) {\n    error('Error', e?.response?.data?.error || e?.message || 'Error al aplicar cambios')\n  } finally {\n    isSaving.value = false\n    pendingAction = null\n  }\n}\n\nfunction confirmRevokeSessions() {\n  if (!user.value) return\n  pendingAction = 'revokeSessions'\n  confirmTitle.value = 'Revocar Sesiones'\n  confirmMessage.value = \`¿Estás seguro de que quieres revocar todas las sesiones activas para ${user.value.email}?\`\n  confirmDetails.value = 'Esta acción cerrará la sesión del usuario en todos los dispositivos. El usuario deberá volver a iniciar sesión.'\n  confirmVariant.value = 'danger'\n  showConfirm.value = true\n}\n`;
s=s.replace(/async\s+function\s+applyConfirmedChange[\s\S]*?(?=\n\/\/\s*Acciones\s+directas\s+de\s+estado\s+con\s+confirmación)/,fn);
if(!/Revocar sesiones/.test(s)){
  s=s.replace(/(<BaseButton\s+variant=\"secondary\"\s+@click=\"goBack\">Volver<\/BaseButton>)/,'$1\n              <BaseButton variant=\"danger\" @click=\"confirmRevokeSessions\">Revocar sesiones<\/BaseButton>');
}
fs.writeFileSync(p,s);
console.log('Updated UserEditView.vue');
