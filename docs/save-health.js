// Save selection and elapsed time are kept independent from IndexedDB so that
// recovery rules can be checked without touching a player's actual city.
export function chooseStoredSave(primary,backup,isValid){
  const primaryOk=!!isValid(primary),backupOk=!!isValid(backup);
  if(!primaryOk&&!backupOk)return {source:null,recovered:false,primaryOk,backupOk};
  if(!primaryOk)return {source:backup,recovered:true,primaryOk,backupOk};
  if(!backupOk)return {source:primary,recovered:false,primaryOk,backupOk};
  // A newer-format recovery is more useful than an outdated primary. Within
  // the same format, choose the last successfully committed snapshot.
  const backupNewer=backup.version>primary.version||(backup.version===primary.version&&
    Number.isFinite(backup.savedAt)&&Number.isFinite(primary.savedAt)&&backup.savedAt>primary.savedAt);
  return {source:backupNewer?backup:primary,recovered:backupNewer,primaryOk,backupOk};
}

export function secondsSince(savedAt,now=Date.now()){
  if(!Number.isFinite(savedAt)||!Number.isFinite(now))return 0;
  return Math.max(0,(now-savedAt)/1000);
}

export function saveMarker(snapshot){
  if(!snapshot||!Number.isFinite(snapshot.savedAt))return null;
  return `${snapshot.version}:${snapshot.savedAt}`;
}
