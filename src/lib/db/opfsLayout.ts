/**
 * OPFS names shared by the DB worker and the main thread (which deletes the
 * dictionary by removing the pointer after terminating the worker). The same
 * literal is inlined in the reset scripts of index.html and public/sw.js.
 */

/** Plain OPFS file naming the active sahpool DB file; no pointer = no DB installed. */
export const ACTIVE_POINTER_FILENAME = 'samuel-db-active.txt';
