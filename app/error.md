PS C:\Users\macky\.gemini\antigravity\scratch\v0-eyestrain\backend> python c:\Users\macky\.gemini\antigravity\scratch\v0-eyestrain\backend\run_import.py
Starting import of 71 survey rows...
  [1/71] FAILED — [Errno 11001] getaddrinfo failed
  [2/71] FAILED — [Errno 11001] getaddrinfo failed
  [3/71] FAILED — [Errno 11001] getaddrinfo failed
  [4/71] FAILED — [Errno 11001] getaddrinfo failed
  [5/71] FAILED — [Errno 11001] getaddrinfo failed
  [6/71] FAILED — [Errno 11001] getaddrinfo failed
  [7/71] FAILED — [Errno 11001] getaddrinfo failed
  [8/71] FAILED — [Errno 11001] getaddrinfo failed
  [9/71] FAILED — [Errno 11001] getaddrinfo failed
  [10/71] FAILED — [Errno 11001] getaddrinfo failed
  [11/71] FAILED — [Errno 11001] getaddrinfo failed
  [12/71] FAILED — [Errno 11001] getaddrinfo failed
  [13/71] FAILED — [Errno 11001] getaddrinfo failed
  [14/71] FAILED — [Errno 11001] getaddrinfo failed
  [15/71] FAILED — [Errno 11001] getaddrinfo failed
  [16/71] FAILED — [Errno 11001] getaddrinfo failed
  [17/71] FAILED — [Errno 11001] getaddrinfo failed
  [18/71] FAILED — [Errno 11001] getaddrinfo failed
  [19/71] FAILED — [Errno 11001] getaddrinfo failed
  [20/71] FAILED — [Errno 11001] getaddrinfo failed
  [21/71] FAILED — [Errno 11001] getaddrinfo failed
  [22/71] FAILED — [Errno 11001] getaddrinfo failed
  [23/71] FAILED — [Errno 11001] getaddrinfo failed
  [24/71] FAILED — [Errno 11001] getaddrinfo failed
  [25/71] FAILED — [Errno 11001] getaddrinfo failed
  [26/71] FAILED — [Errno 11001] getaddrinfo failed
  [27/71] FAILED — [Errno 11001] getaddrinfo failed
  [28/71] FAILED — [Errno 11001] getaddrinfo failed
  [29/71] FAILED — [Errno 11001] getaddrinfo failed
  [30/71] FAILED — [Errno 11001] getaddrinfo failed
  [31/71] FAILED — [Errno 11001] getaddrinfo failed
  [32/71] FAILED — [Errno 11001] getaddrinfo failed
  [33/71] FAILED — [Errno 11001] getaddrinfo failed
  [34/71] FAILED — [Errno 11001] getaddrinfo failed
  [35/71] FAILED — [Errno 11001] getaddrinfo failed
  [36/71] FAILED — [Errno 11001] getaddrinfo failed
  [37/71] FAILED — [Errno 11001] getaddrinfo failed
  [38/71] FAILED — [Errno 11001] getaddrinfo failed
  [39/71] FAILED — [Errno 11001] getaddrinfo failed
  [40/71] FAILED — [Errno 11001] getaddrinfo failed
  [41/71] FAILED — [Errno 11001] getaddrinfo failed
  [42/71] FAILED — [Errno 11001] getaddrinfo failed
  [43/71] FAILED — [Errno 11001] getaddrinfo failed
  [44/71] FAILED — [Errno 11001] getaddrinfo failed
  [45/71] FAILED — [Errno 11001] getaddrinfo failed
  [46/71] FAILED — [Errno 11001] getaddrinfo failed
  [47/71] FAILED — [Errno 11001] getaddrinfo failed
  [48/71] FAILED — [Errno 11001] getaddrinfo failed
  [49/71] FAILED — [Errno 11001] getaddrinfo failed
  [50/71] FAILED — [Errno 11001] getaddrinfo failed
  [51/71] FAILED — [Errno 11001] getaddrinfo failed
  [52/71] FAILED — [Errno 11001] getaddrinfo failed
  [53/71] FAILED — [Errno 11001] getaddrinfo failed
  [54/71] FAILED — [Errno 11001] getaddrinfo failed
  [55/71] FAILED — [Errno 11001] getaddrinfo failed
  [56/71] FAILED — [Errno 11001] getaddrinfo failed
  [57/71] FAILED — [Errno 11001] getaddrinfo failed
  [58/71] FAILED — [Errno 11001] getaddrinfo failed
  [59/71] FAILED — [Errno 11001] getaddrinfo failed
  [60/71] FAILED — [Errno 11001] getaddrinfo failed
  [61/71] FAILED — [Errno 11001] getaddrinfo failed
  [62/71] FAILED — [Errno 11001] getaddrinfo failed
  [63/71] FAILED — [Errno 11001] getaddrinfo failed
  [64/71] FAILED — [Errno 11001] getaddrinfo failed
  [65/71] FAILED — [Errno 11001] getaddrinfo failed
  [66/71] FAILED — [Errno 11001] getaddrinfo failed
  [67/71] FAILED — [Errno 11001] getaddrinfo failed
  [68/71] FAILED — [Errno 11001] getaddrinfo failed
  [69/71] FAILED — [Errno 11001] getaddrinfo failed
  [70/71] FAILED — [Errno 11001] getaddrinfo failed
  [71/71] FAILED — [Errno 11001] getaddrinfo failed

Done. 0 inserted, 71 failed.

If you see foreign key errors, run this in Supabase SQL Editor first:
  ALTER TABLE public.daily_logs ALTER COLUMN user_id DROP NOT NULL;
  ALTER TABLE public.daily_logs DROP CONSTRAINT IF EXISTS daily_logs_user_id_fkey;
PS C:\Users\macky\.gemini\antigravity\scratch\v0-eyestrain\backend>