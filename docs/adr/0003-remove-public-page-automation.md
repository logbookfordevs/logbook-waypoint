# Remove public page automation

Waypoint will remove the public page-world annotation CRUD interface because any script running on the page could invoke it. A narrow read-only MAIN-world probe remains for React Source Identity, with Vue supported only when it fits the same interface; all returned page-derived information is treated as untrusted.
