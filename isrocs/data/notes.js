/* Study notes (Module 3). Each chapter is a small markdown dialect rendered by app.js:
   # / ## / ### headings, - lists, | tables |, > tips, **bold**, ``` code blocks. */

ISRO.addNotes('guide', 'Exam blueprint & strategy', `
# What the paper looks like
| Part | Questions | Marks | Negative |
?? The paper has two parts. Part A is the real computer-science test: 80 questions, 1 mark each, and every wrong answer takes away one-third of a mark. Part B is general aptitude (puzzles, maths, reasoning): 15 questions worth 20 marks in total, and wrong answers cost nothing.
|---|---|---|---|
| A — Discipline specific (CS) | 80 | 1 each = 80 | −0.33 per wrong |
| B — Ability test (aptitude) | 15 | 20 total (mix of 1 & 2 mark) | None |

- Duration: 120 minutes, OMR, single correct option. 95 questions → about 75 s per question.
?? OMR means you shade bubbles on a sheet that a machine reads. 120 minutes ÷ 95 questions ≈ 75 seconds each — so if a question is eating 3 minutes, mark it and move on; you can come back.
- The written test only shortlists for the interview — but the cut-off is usually high, so accuracy matters more than attempting everything.
?? This exam does not give you the job — it only decides who is called for the interview. Because many people clear it, the cut-off is high. Ten sure answers are worth more than fifteen guesses, because wrong guesses subtract marks.
- **Part B has no negative marking — attempt every Part B question.**
?? Since a wrong answer in Part B costs zero, even a blind guess has a 25% chance of free marks and no downside. Never leave a Part B bubble empty.

# Where the marks came from (2023 + 2025 combined)
| Area | 2023 | 2025 | Priority |
?? This table counts how many questions each subject got in the last two papers. Subjects with more questions deserve more of your remaining time — OS, Networks and Security together gave about 20 questions each year.
|---|---|---|---|
| OS | 8 | 8 | Very high |
| Computer Networks | 6 | 6 | Very high |
| Information Security | 5 | 9 | Very high (rising) |
| DBMS | 5 | 7 | High |
| TOC + Compiler | 10 | 10 | High (very predictable) |
| Digital Logic + COA | 11 | 7 | High |
| DS + Algorithms | 12 | 7 | High |
| Discrete & Engg Maths | 7 | 7 | Medium |
| Software Engineering | 5 | 8 | Medium (easy marks) |
| AI/ML | 3 | 5 | Medium (easy marks) |
| Cloud / Big Data / Virtualization | 6 | 7 | Medium (easy marks) |

> Pattern change: ISRO now asks 15–20 questions from "new" areas — security, AI, cloud, big data, software engineering. These are definition-level and are the cheapest marks in the paper. Do not skip them.
?? Old ISRO papers were mostly classic CS. Recent ones add modern topics like cyber security, AI, cloud. Those questions are usually "what is X?" — if you have read the definition once, you get the mark. Very little effort for guaranteed marks.

> Questions repeat! 2025 Q80 was word-for-word 2023 Q57 (S → aSb | T, T → bT | b). The TOC questions in both years use the same template: "Consider the DFA/NFA/CFG below…". Practise the past papers until you can answer them instantly.
?? ISRO literally reused a question from 2023 in 2025. So the two past papers in this app are the single best practice material — redo them until every answer is automatic.

# Negative-marking maths
- A wrong answer costs 1/3. If you can eliminate **one** option, guessing among 3 has expected value 1/3 − 2/3·1/3 = +0.11 → worth it.
?? If you can rule out one option as definitely wrong, you guess among 3. Chance of being right = 1/3 (gain 1); chance wrong = 2/3 (lose 1/3). Average = 1/3 − 2/9 ≈ +0.11 marks per guess — a small gain, so guess.
- If you cannot eliminate anything, expected value = 1/4 − 3/4·1/3 = 0 → skip unless you have a hunch.
?? With 4 equally likely options: 1/4 chance of +1 and 3/4 chance of −1/3. Average = 0.25 − 0.25 = 0. A pure blind guess neither helps nor hurts on average, so it is just a gamble — skip it unless something tells you an answer.
- Target: 55+ attempted Part A with ≥ 85% accuracy and all 15 of Part B.
?? A realistic goal: answer around 55 or more of the 80 CS questions, getting at least 85% of those right, and answer all 15 aptitude ones. That combination usually clears the cut-off.

# Three-day plan (27 → 29 Oct)
1. **Day 1:** Both solved past papers (Study tab) → OS, CN, DBMS notes → quiz 150 questions from those subjects.
?? Day 1 plan: these three subjects carry the most marks, so do them first while you are fresh, and use the quiz to check that the notes actually stuck.
2. **Day 2:** TOC, Compiler, DL, COA, DS/Algo notes → quiz 150 → review every wrong answer (Quiz › Wrong).
?? Day 2 plan: these subjects are more about solving (automata, circuits, pipelines). After the quiz, the most valuable step is going through every question you got wrong — that is where your gaps are.
3. **Day 3 (morning of 28th):** Security, AI, Cloud, SE notes (fast, factual) → quiz the remaining → evening: Formula sheet + starred questions only. Sleep early.
?? Day 3 plan: the "new" subjects are mostly definitions, so they are fast to revise. Keep the last evening light: formulas and the questions you starred. Sleep matters more than one extra hour of reading.

# Exam-hall routine
- Pass 1 (≈ 50 min): answer everything you know instantly; mark doubtful ones in the booklet.
?? First pass through the paper: only answer the questions you know at once. This banks easy marks quickly and calms your nerves. Put a small mark next to the ones you skip.
- Pass 2 (≈ 35 min): numericals (pipelining, subnetting, paging, scheduling).
?? Second pass: numerical questions (calculations) take longer, so do them once the easy marks are secured.
- Pass 3: Part B — never leave blank. Bubble the booklet SET code on the OMR.
?? Third pass: Part B. Every bubble filled. Also write and bubble the booklet SET code (A/B/C/D) on the OMR — if you forget, your sheet is not evaluated at all.
`);

ISRO.addNotes('ds', 'Data Structures', `
# Arrays
- Row-major: Loc(A[i][j]) = B + ((i − lr)·N + (j − lc))·w where N = number of columns.
?? A 2-D array is stored in memory as one long line. Row-major means row 0 is stored completely, then row 1, and so on. To reach A[i][j] you skip i full rows (i × N elements) and then j more elements, and multiply by w (bytes per element). lr and lc are the starting indices (usually 0). Example: A[10][20] of 4-byte ints at 1000 → A[5][8] = 1000 + (5×20 + 8)×4 = 1432.
- Column-major: Loc(A[i][j]) = B + ((j − lc)·M + (i − lr))·w where M = number of rows.
?? Same idea, but column-major stores column 0 completely first, then column 1… So to reach A[i][j] you skip j full columns (j × M elements, M = rows) and then i more. Fortran and MATLAB use column-major; C uses row-major.
- Lower-triangular n×n has n(n+1)/2 non-zeros; tri-diagonal has 3n − 2.
?? A lower-triangular matrix has non-zeros only on and below the diagonal: row 1 has 1, row 2 has 2, … row n has n → 1+2+…+n = n(n+1)/2. A tri-diagonal matrix has non-zeros only on the main diagonal (n) and the two diagonals next to it (n−1 each) → 3n − 2.
- A string of length m has m(m+1)/2 non-empty substrings and 2^{m} subsequences.
?? A substring is a continuous piece, like "SR" in "ISRO". Pick where it starts and ends: m + (m−1) + … + 1 = m(m+1)/2 ways. A subsequence keeps order but may skip letters ("IR" from ISRO); each letter is either kept or not → 2 choices per letter → 2^{m}.

# Stack
- LIFO. push/pop/peek O(1). Used for recursion, expression evaluation, DFS, undo, parenthesis matching, backtracking.
?? A stack is like a pile of plates: you can only add (push) or remove (pop) the top one — Last In, First Out. Both operations take constant time. When a function calls another, the computer pushes the caller's details on a stack and pops them on return — that is why recursion uses a stack.
- Infix → postfix: operands go straight to output; operator waits while stack-top has higher (or equal, if left-assoc) precedence. ^ is right-associative.
?? Infix is how humans write (A + B); postfix puts the operator after (A B +), which a computer can evaluate without brackets. Rule: letters/numbers go straight to the output; an operator waits on a stack and is released when a lower-priority operator comes. ^ (power) is right-associative: 2^3^2 means 2^(3^2).
- Evaluate postfix left → right with an operand stack; prefix right → left.
?? To evaluate postfix, read left to right: push numbers on a stack; when you see an operator, pop two numbers, apply it, push the result. For prefix (operator first, like + A B) do the same but read from right to left.
- Number of valid stack permutations of n items = Catalan Cₙ = (2n)! / ((n+1)!·n!) → 1, 1, 2, 5, 14, 42.
?? If you push 1, 2, 3 in that order but can pop whenever you like, only some output orders are possible. For n items the count is the Catalan number: 1, 1, 2, 5, 14, 42… For 3 items there are 5 (3 1 2 is impossible because 2 is above 1 on the stack).
> Example: postfix 6 2 3 + − 3 8 2 / + * → (6 − 5) × (3 + 4) = 7.
?? Walk through it: push 6, 2, 3. "+" pops 2 and 3 → 5. "−" pops 6 and 5 → 1. Push 3, 8, 2. "/" → 8/2 = 4. "+" → 3+4 = 7. "*" → 1 × 7 = 7. Always pop the second number first as the left operand (6 − 5, not 5 − 6).

# Queue
- FIFO. Circular array of size n: empty when front == rear; full when (rear + 1) % n == front.
?? A queue is a line at a ticket counter: join at the back (rear), leave from the front — First In, First Out. In a circular array the end wraps around to the start. One slot is kept empty so that "full" and "empty" look different: if rear is right behind front, it is full.
- Queue from 2 stacks (amortised O(1)); stack from 2 queues (one operation O(n)).
?? You can build a queue from two stacks: push into stack 1; when you need to remove, pour everything into stack 2 (which reverses the order) and pop. Each item moves at most twice, so on average each operation is constant time ("amortised O(1)").
- Deque: insert/delete both ends. Priority queue: binary heap → insert O(log n), delete-min O(log n), find-min O(1).
?? A deque (double-ended queue) lets you add/remove at both ends. A priority queue always gives you the most urgent (smallest or largest) item, like an emergency ward. It is usually built with a binary heap, where adding or removing costs about log₂ n steps.

# Linked lists
- Insert at head O(1); search/delete-by-value O(n); no random access, so binary search is O(n).
?? A linked list is a chain of boxes, each pointing to the next. Adding at the front is instant (point the new box at the old first box). But to find something you must walk the chain from the start, so search is O(n) — and binary search loses its advantage because you cannot jump to the middle.
- Reverse iteratively with prev/curr/next. Detect cycle: Floyd (slow + fast pointer), O(1) space.
?? To reverse a list, walk through it and flip each arrow backwards, keeping three pointers (previous, current, next) so you do not lose the rest of the chain. To check for a loop, send a slow pointer (1 step) and a fast pointer (2 steps); if there is a loop, the fast one eventually laps and meets the slow one.
- Doubly linked: insertion between two nodes changes 4 pointers.
?? In a doubly linked list each node points both forward and backward. Inserting a new node between X and Y needs: new→next = Y, new→prev = X, X→next = new, Y→prev = new — four pointer updates.

# Trees
| Fact | Formula |
?? Quick facts about binary trees (each node has at most 2 children). E.g. a tree of height 2 has at most 1 + 2 + 4 = 7 nodes. The leaf rule n₀ = n₂ + 1 says leaves are always one more than nodes with two children — handy for "find the number of leaves" questions.
|---|---|
| Max nodes, height h (root h = 0) | 2^{h+1} − 1 |
| Min height with n nodes | ⌈log₂(n+1)⌉ − 1 |
| Leaves vs degree-2 nodes | n₀ = n₂ + 1 |
| NULL pointers in n-node tree | n + 1 |
| Full binary tree with I internal nodes | L = I + 1, total 2I + 1 |
| Unlabelled shapes with n nodes / BSTs on n keys | Catalan Cₙ |
| Labelled binary trees | n! · Cₙ |

- Inorder of a BST is sorted. **Inorder + preorder** or **inorder + postorder** uniquely fixes a tree; preorder + postorder only for full binary trees.
?? Inorder = left, root, right. In a BST everything on the left is smaller and on the right is larger, so inorder visits keys in sorted order. To rebuild a tree you need inorder (tells left vs right of each root) plus preorder or postorder (tells which node is the root).
- BST predecessor = max of left subtree; successor = min of right subtree. Deleting a 2-child node: copy successor, delete successor.
?? The predecessor of a node is the next smaller key: go one step left, then as far right as possible. The successor is the next larger key: one step right, then as far left as possible. When deleting a node with two children, replace its value with the successor's, then delete the successor (which has at most one child).
- Diameter in O(n): one post-order pass computing heights.
?? Diameter = longest path between any two nodes. Compute each node's height from its children (post-order) and, at the same time, check whether left height + right height beats the best so far. Each node is visited once → O(n).

## Balanced trees
- **AVL:** balance factor ∈ {−1, 0, 1}. Height ≤ 1.44 log n. Min nodes N(h) = N(h−1) + N(h−2) + 1 → 1, 2, 4, 7, 12, 20. Rotations: LL → right, RR → left, LR → left-right, RL → right-left.
?? An AVL tree is a BST that keeps itself balanced: at every node the left and right heights differ by at most 1. If an insert breaks this, a "rotation" (re-hanging a few nodes) fixes it. Balance keeps search at O(log n). The minimum-nodes formula grows like Fibonacci.
- **Red-black:** root & leaves black, no red-red, equal black-height → height ≤ 2 log₂(n+1).
?? A red-black tree is another self-balancing BST. Colouring rules guarantee the longest path is at most twice the shortest, so height stays O(log n). It is used inside many libraries (C++ map, Java TreeMap).
- **B-tree (order m):** non-root nodes have ⌈m/2⌉ … m children; all leaves at the same level. **B+ tree:** records only in leaves, leaves linked → range queries; used for DB indexes.
?? A B-tree is a "fat" tree where each node holds many keys and has many children, so the tree is very short — perfect for disks, where each node read is slow. A B+ tree keeps all real records in the bottom level and links those leaves left-to-right, so "find all values between 10 and 50" is just a walk along the leaves. Databases use B+ trees for indexes.

## Heaps
- Complete binary tree in an array: children of i at 2i and 2i+1 (1-based), parent ⌊i/2⌋.
?? A complete binary tree can be stored in a plain array with no pointers: put the root at index 1; the children of the node at index i are at 2i and 2i+1, and its parent is at i/2 (rounded down). E.g. node 5's children are 10 and 11.
- Build-heap is **O(n)**; insert & delete O(log n); heap sort O(n log n), in-place, unstable.
?? A heap is a complete binary tree where each parent is ≤ its children (min-heap) or ≥ (max-heap). Building one from n random numbers takes only O(n) — surprising but true, because most nodes are near the bottom and move very little. Heap sort repeatedly removes the max: O(n log n).
- In a min-heap the maximum is in a leaf (positions ⌊n/2⌋+1 … n).
?? In a min-heap every parent is smaller than its children, so the largest value can never have children — it must be a leaf. Leaves are the second half of the array. So finding the max still means checking about n/2 elements.

# Hashing
- Division method h(k) = k mod m with m prime, away from powers of 2.
?? Hashing turns a key into an array position. Division method: position = key mod m (the remainder). Choosing m as a prime spreads keys evenly; m = power of 2 would just use the last few bits of the key.
- Chaining: works with load factor α > 1; unsuccessful search Θ(1 + α).
?? Chaining: each array slot holds a linked list of all keys that landed there. The load factor α = keys ÷ slots is the average list length. It can exceed 1 (more keys than slots). A failed search scans one whole list → about 1 + α steps.
- Open addressing (α ≤ 1): linear probing → primary clustering; quadratic → secondary clustering; double hashing → best.
?? Open addressing stores everything inside the array itself; on a collision you probe other slots. Linear probing (next slot, next slot…) creates long runs of filled slots ("primary clustering"). Quadratic probing jumps 1, 4, 9… slots. Double hashing uses a second hash for the jump size — the most even spread.
- Expected probes (open addressing, uniform hashing): unsuccessful 1/(1 − α).
?? With open addressing, as the table fills up (α close to 1), the expected number of probes for a failed search, 1/(1 − α), shoots up: at 50% full it is 2, at 90% full it is 10.

# Graph representation
- Adjacency matrix: O(V²) space, O(1) edge lookup. Adjacency list: O(V + E).
?? Two ways to store a graph. A matrix is a V×V grid of yes/no — quick to ask "is there an edge u–v?" but needs V² space. An adjacency list stores, for each vertex, just its neighbours — uses space proportional to vertices + edges, better when there are few edges.
- BFS uses a queue; DFS uses a stack/recursion. Both O(V + E) with lists, O(V²) with a matrix.
?? BFS explores level by level (all neighbours first) using a queue; DFS goes as deep as possible first using a stack (or recursion). With adjacency lists each vertex and edge is handled once → O(V + E); with a matrix you scan a full row for each vertex → O(V²).
`);

ISRO.addNotes('algo', 'Algorithms', `
# Growth rates
1 < log log n < log n < √n < n < n log n < n² < n³ < n^{log n} < 2ⁿ < n! < nⁿ
?? This is the "speed ranking" of functions as n grows big. Anything on the left grows slower (faster algorithm). E.g. for n = 1,000,000: log n ≈ 20, √n = 1000, n² = 10¹², 2ⁿ is astronomically large. Memorise the order — ISRO asks "arrange in increasing order of complexity".
- log(n!) = Θ(n log n); Σ 1/i = Θ(log n); Σ i^{k} = Θ(n^{k+1}).
?? log(n!) behaves like n log n (that is why sorting needs n log n comparisons). The harmonic sum 1 + 1/2 + 1/3 + … + 1/n grows like log n. Adding up i^{k} for i = 1..n is about n^{k+1}, e.g. 1 + 2 + … + n ≈ n².

# Recurrences — Master theorem
T(n) = aT(n/b) + f(n). Let c = log_b a.
?? The Master theorem solves "divide and conquer" running times. a = how many sub-problems, n/b = size of each, f(n) = extra work to split/combine. Compute c = log_b a and compare f(n) with n^{c}: whichever is bigger wins.
1. f(n) = O(n^{c−ε}) → Θ(n^{c})
?? Case 1: the combine work f(n) is smaller than n^{c} → the many small sub-problems dominate → answer n^{c}. E.g. T(n) = 2T(n/2) + 1: c = 1, f = 1 is smaller → Θ(n).
2. f(n) = Θ(n^{c}·logᵏ n) → Θ(n^{c}·log^{k+1} n)
?? Case 2: f(n) is about equal to n^{c} → every level of recursion does the same work, and there are log n levels → multiply by one extra log. E.g. merge sort 2T(n/2) + n: c = 1, f = n → Θ(n log n).
3. f(n) = Ω(n^{c+ε}) and regularity → Θ(f(n))
?? Case 3: f(n) is bigger than n^{c} → the top-level work dominates → answer f(n). E.g. T(n) = 2T(n/2) + n²: c = 1, n² is bigger → Θ(n²).

| Recurrence | Result | Example |
?? Memorise these standard recurrences — ISRO often gives one directly. Pattern: halving with constant work → log n; halving twice with linear work → n log n; reducing by 1 with linear work → n²; doubling calls each step → 2ⁿ.
|---|---|---|
| T(n/2) + 1 | log n | Binary search |
| 2T(n/2) + 1 | n | Tree traversal |
| 2T(n/2) + n | n log n | Merge sort |
| T(n−1) + 1 | n | Linear recursion |
| T(n−1) + n | n² | Selection/quick worst |
| 2T(n−1) + 1 | 2ⁿ | Tower of Hanoi |
| 3T(n/2) + n | n^{1.58} | Karatsuba |
| 7T(n/2) + n² | n^{2.81} | Strassen |
| T(√n) + 1 | log log n | — |

# Sorting
| Algorithm | Best | Average | Worst | Space | Stable | In-place |
?? The sorting cheat-sheet. "Stable" = equal keys keep their original order (matters when sorting records by one field). "In-place" = needs no big extra array. Quick sort is fastest in practice but has an n² worst case; merge sort is always n log n but needs extra memory.
|---|---|---|---|---|---|---|
| Bubble | n | n² | n² | 1 | Yes | Yes |
| Selection | n² | n² | n² | 1 | No | Yes |
| Insertion | n | n² | n² | 1 | Yes | Yes |
| Merge | n log n | n log n | n log n | n | Yes | No |
| Quick | n log n | n log n | n² | log n | No | Yes |
| Heap | n log n | n log n | n log n | 1 | No | Yes |
| Counting | n + k | n + k | n + k | k | Yes | No |
| Radix | d(n + k) | d(n + k) | d(n + k) | n + k | Yes | No |
- Comparison sorting lower bound: Ω(n log n) (decision tree with n! leaves).
?? Any sort that only compares two items at a time needs at least about n log n comparisons, because there are n! possible orders and each comparison only splits the possibilities in two. Counting/radix sort beat this because they do not compare.
- Selection sort makes the fewest swaps (n − 1). Insertion sort is best for nearly-sorted input.
?? Selection sort finds the smallest and swaps it into place, once per position → only n − 1 swaps (useful when swaps are expensive). Insertion sort takes each item and slides it left into place — on almost-sorted data it barely moves anything, so it is nearly O(n).
- Identify the sort from intermediate arrays: insertion → prefix sorted, rest untouched; selection → prefix holds the overall smallest elements; bubble → suffix holds the largest.
?? Exam trick: if after k passes the first k+1 items are sorted among themselves but the rest is untouched → insertion sort. If the first k items are the k smallest overall → selection sort. If the last k items are the k largest → bubble sort.

# Greedy
- Works when greedy-choice property + optimal substructure hold.
?? A greedy algorithm makes the best-looking choice at each step and never reconsiders. It only gives the correct answer for problems where a locally best choice is always part of some overall best solution — e.g. picking the cheapest edge in MST works, but greedy fails for 0/1 knapsack.
- Huffman (merge two smallest), fractional knapsack (value/weight), activity selection (earliest finish), Kruskal, Prim, Dijkstra, optimal merge pattern.
?? Classic greedy algorithms to recognise. Huffman: repeatedly merge the two rarest symbols to build a compression code. Fractional knapsack: take items in order of value per kg. Activity selection: always pick the meeting that ends earliest.
- **Kruskal**: sort edges, add if no cycle (union-find): O(E log E). **Prim**: grow from a vertex: O(E log V) heap, O(V²) matrix.
?? Both build a minimum spanning tree (cheapest set of edges connecting all vertices). Kruskal sorts all edges by weight and adds each one unless it would make a loop. Prim starts at one vertex and keeps adding the cheapest edge leading out of the tree built so far.
- **Dijkstra**: non-negative weights; O((V + E) log V) binary heap, O(V²) array.
?? Dijkstra finds the shortest distance from one start vertex to all others: always finalise the closest unvisited vertex next. It breaks if some edge weights are negative, because a "finished" vertex could later become cheaper.

# Dynamic programming
| Problem | Time |
?? Dynamic programming = break a problem into overlapping sub-problems and store each answer in a table so it is computed once. The running time is (number of table cells) × (work per cell). E.g. LCS has m × n cells, each O(1) → O(mn).
|---|---|
| 0/1 knapsack | O(nW) (pseudo-polynomial) |
| LCS / edit distance | O(mn) |
| Matrix chain | O(n³) |
| Bellman-Ford | O(VE) — handles negative edges, detects negative cycles |
| Floyd-Warshall | O(V³) all pairs |
| TSP (Held-Karp) | O(n²·2ⁿ) |
> Matrix chain: cost of multiplying p×q by q×r = p·q·r. Always try both parenthesisations for 3 matrices.
?? Multiplying a p×q matrix by a q×r matrix takes p·q·r multiplications. With three matrices A, B, C, compute both (AB)C and A(BC) and pick the cheaper — the order can change the cost hugely (e.g. 4500 vs 27000).

# Graph algorithms
- BFS: shortest paths in unweighted graphs. DFS: topological sort (reverse finish order), cycle detection (back edge), SCC (Kosaraju/Tarjan), articulation points & bridges — all O(V + E).
?? BFS gives shortest paths when every edge counts as 1 step. DFS is the tool for structure questions: ordering tasks with dependencies (topological sort), detecting loops, and finding weak points (articulation points/bridges) whose removal disconnects the graph.
- Spanning tree has V − 1 edges; Kₙ has n^{n−2} spanning trees.
?? A spanning tree connects all V vertices with no loops, which always needs exactly V − 1 edges. Cayley's formula: a complete graph on n labelled vertices has n^{n−2} different spanning trees (K₄ → 16).
- Which algorithm? one pair / single source (+ve) → Dijkstra; negative edges → Bellman-Ford; all pairs → Floyd-Warshall; MST → Kruskal/Prim.
?? Decision guide for shortest paths: one source with non-negative weights → Dijkstra; negative weights → Bellman-Ford; every pair of vertices → Floyd-Warshall. For connecting everything cheaply (not paths) → Kruskal or Prim.

# Divide & conquer
Merge sort, quick sort, binary search, Strassen (7 multiplications), Karatsuba, closest pair O(n log n), max-min with 3n/2 − 2 comparisons.
?? Divide and conquer = split the problem into smaller copies, solve them recursively, combine. Examples to recognise: merge sort, binary search, Strassen's matrix multiplication (7 instead of 8 block multiplications), and finding max and min together in about 1.5n comparisons.

# String matching
Naive O(nm); KMP O(n + m) with LPS array; Rabin-Karp expected O(n + m), worst O(nm); Boyer-Moore sub-linear in practice.
?? String matching = finding a pattern of length m inside a text of length n. The naive way checks every position (n × m). KMP pre-computes how far it can safely jump after a mismatch, so it never re-reads text → n + m. Rabin-Karp compares hashes of windows instead of characters.

# Complexity classes
- P ⊆ NP. NP-complete = in NP and every NP problem reduces to it. To show X is NP-hard: reduce a known NPC problem **to** X.
?? P = problems solvable quickly (polynomial time). NP = problems whose answers can be checked quickly. NP-complete = the hardest problems in NP. To prove a new problem is hard, show that a known hard problem can be turned into it — direction matters.
- NPC: SAT, 3-SAT, clique, vertex cover, independent set, Hamiltonian cycle, TSP (decision), subset sum, 0/1 knapsack (decision), graph k-colouring (k ≥ 3).
?? A list of famous NP-complete problems — no fast algorithm is known for any of them. If an exam option says "polynomial algorithm for 3-SAT/TSP/clique", it is almost certainly wrong.
- In P: 2-SAT, shortest paths, MST, max-flow, bipartite matching, primality, linear programming.
?? Problems that look similar but are actually easy (polynomial): 2-SAT (but 3-SAT is hard), shortest path (but longest path is hard), MST, matching. Good for "which is NOT NP-complete" questions.
`);

ISRO.addNotes('math', 'Discrete & Engineering Maths', `
# Logic
- p → q ≡ ¬p ∨ q ≡ ¬q → ¬p (contrapositive). Converse q → p and inverse ¬p → ¬q are NOT equivalent to it.
?? "p → q" means "if p then q". It is only false when p is true and q is false. Its contrapositive "if not q then not p" always means the same thing (if it is raining the ground is wet ⇔ if the ground is dry it is not raining). The converse "if q then p" is a different statement.
- ¬∀x P(x) ≡ ∃x ¬P(x). Number of Boolean functions of n variables = 2^{2ⁿ}.
?? "Not everyone passed" is the same as "someone did not pass" — that is ¬∀ = ∃¬. A Boolean function of n inputs is a truth table with 2ⁿ rows, and each row can output 0 or 1 independently, so there are 2^{2ⁿ} different functions (n = 2 → 16).

# Sets, relations, functions (|A| = n)
| Count | Value |
?? A relation on a set is just a set of ordered pairs (a, b). With n elements there are n² possible pairs, each in or out → 2^{n²} relations. The other rows count how many pairs are forced or tied together by each rule: reflexive forces all (a, a) in; symmetric ties (a, b) with (b, a).
|---|---|
| Relations | 2^{n²} |
| Reflexive (or irreflexive) | 2^{n²−n} |
| Symmetric | 2^{n(n+1)/2} |
| Antisymmetric | 2ⁿ · 3^{n(n−1)/2} |
| Equivalence relations | Bell number Bₙ (1, 2, 5, 15, 52) |
| Functions A → B (B has m elements) | mⁿ |
| One-one (n ≤ m) | m!/(m − n)! |
| Onto | Σ (−1)ᵏ C(m,k)(m − k)ⁿ |
- Partial order = reflexive + antisymmetric + transitive. Lattice: every pair has LUB and GLB.
?? A partial order is like "is a divisor of" or "≤": every element relates to itself, two different elements cannot relate both ways, and it chains (a ≤ b ≤ c ⇒ a ≤ c). A lattice is a partial order where any two elements have a smallest common upper bound and a largest common lower bound.
- Group theory: Lagrange (subgroup order divides group order); cyclic ⇒ abelian; group of prime order is cyclic.
?? A group is a set with an operation (like + on integers) that has identity, inverses, and is associative. Lagrange: a sub-group's size always divides the group's size — so a group of 7 elements can only have subgroups of size 1 or 7. Abelian = order of operation does not matter (a·b = b·a).

# Combinatorics
- nPr = n!/(n−r)!, nCr = n!/(r!(n−r)!). Arrangements with repeats: n!/(n₁!n₂!…) — BANANA = 60.
?? nPr counts ordered arrangements (who is 1st, 2nd…), nCr counts unordered choices (just which ones). If letters repeat, divide by the arrangements of the identical letters: BANANA has 6 letters, A ×3 and N ×2 → 720 / (6 × 2) = 60.
- Non-negative solutions of x₁ + … + x_{r} = n: C(n + r − 1, r − 1).
?? Stars and bars: to split n identical sweets among r children (some may get zero), imagine n stars and r − 1 dividers in a row; choose where the dividers go: C(n + r − 1, r − 1). E.g. x + y + z = 10 → C(12, 2) = 66.
- Pigeonhole: n items in k boxes → some box has ⌈n/k⌉.
?? If you put more items than boxes, some box must have at least two. More generally some box has at least ⌈n/k⌉ (n divided by k, rounded up). 13 people → two share a birth month.
- Derangements: D₁..D₅ = 0, 1, 2, 9, 44.
?? A derangement is a shuffle where nothing stays in its original place (e.g. 4 letters, nobody gets their own). D₄ = 9. For large n, about 37% (1/e) of all shuffles are derangements.
- Subsets of {1..n} with no two consecutive elements: F(n + 2) (Fibonacci) → n = 12 gives 377.
?? Pick numbers from 1..n with no two neighbours. Either n is not picked (count for n − 1) or n is picked, so n − 1 is not (count for n − 2). That is the Fibonacci rule, giving F(n + 2). Asked in ISRO 2025 for n = 12 → 377.
- Catalan Cₙ: 1, 1, 2, 5, 14, 42, 132 — BST counts, stack permutations, balanced parentheses.
?? The Catalan numbers appear whenever you count "properly nested" structures: number of different BST shapes, stack output orders, valid bracket strings. Remember the sequence 1, 1, 2, 5, 14, 42.

# Graph theory
- Handshaking: Σ deg(v) = 2|E|; number of odd-degree vertices is even.
?? Every edge has two ends, so adding up all vertex degrees counts each edge twice → sum = 2E. Since the total is even, there must be an even number of odd-degree vertices.
- Kₙ: n(n−1)/2 edges; K_{m,n}: mn edges. Labelled simple graphs on n vertices: 2^{n(n−1)/2}.
?? Kₙ is the complete graph where every pair is joined: n(n−1)/2 edges. K_{m,n} has two groups with every left vertex joined to every right vertex: m × n edges. Each of the n(n−1)/2 possible edges is present or absent → 2^{n(n−1)/2} graphs.
- Tree: n − 1 edges; forest with k trees: n − k edges.
?? A tree is connected with no cycles — removing any edge disconnects it. It always has exactly one fewer edge than vertices. A forest is several separate trees: n − (number of trees) edges.
- Planar connected: V − E + F = 2; E ≤ 3V − 6 (E ≤ 2V − 4 if no triangles). K₅ and K₃,₃ are non-planar.
?? A planar graph can be drawn on paper with no edges crossing. Euler's formula: vertices − edges + faces (regions, counting the outside) = 2. Because each face needs at least 3 edges, E ≤ 3V − 6. K₅ has 10 edges > 3×5 − 6 = 9, so it cannot be planar.
- k-regular graph: E = kV/2.
?? In a k-regular graph every vertex has degree k. Using the handshake rule, total degree kV = 2E → E = kV/2. (ISRO 2025: 20 malls, 3 roads each → 30 roads.)
- Euler circuit ⇔ connected and all degrees even. Euler path ⇔ exactly 0 or 2 odd vertices. Hamiltonian: no simple criterion (NPC).
?? An Euler circuit uses every edge exactly once and returns to start (like drawing a figure without lifting the pen). Possible only if every vertex has even degree — you must leave every vertex as often as you enter. A Hamiltonian cycle visits every vertex once — no easy test exists.
- Chromatic number: Kₙ → n, bipartite → 2, odd cycle → 3, even cycle → 2, planar ≤ 4, tree → 2.
?? Chromatic number = fewest colours so that neighbours never share a colour. A complete graph needs n (everyone touches everyone). Bipartite graphs need 2. An odd cycle needs 3 (try colouring a triangle with 2). Any map/planar graph needs at most 4.
- Eccentricity of v = max distance from v; radius = min eccentricity; diameter = max eccentricity; girth = length of shortest cycle.
?? Eccentricity of a vertex = distance to the farthest vertex from it. The radius is the smallest eccentricity (the "centre" vertex), the diameter the largest. Girth = length of the shortest cycle (a triangle gives girth 3).

# Linear algebra
- det = 0 if two rows/columns are equal or proportional, or one is a combination of others.
?? The determinant is zero exactly when the rows do not carry independent information — e.g. one row is double another (ISRO 2023 Q41: row 3 = 2 × row 1 → det = 0). Spot this before doing any arithmetic.
- det(AB) = det A · det B; det(Aᵀ) = det A; det(kA) = kⁿ det A; det(A⁻¹) = 1/det A.
?? Handy determinant rules: multiply matrices → multiply determinants; transposing changes nothing; multiplying an n×n matrix by k multiplies the determinant by kⁿ (each of n rows gets ×k).
- Rank = number of linearly independent rows. Ax = b: consistent iff rank(A) = rank([A|b]); unique iff that rank = number of unknowns.
?? Rank = how many rows are genuinely independent. For equations Ax = b: if adding the b column raises the rank, the equations contradict each other (no solution). If rank equals the number of unknowns, exactly one solution; if less, infinitely many.
- Eigenvalues: Σλ = trace, Πλ = det. Triangular/diagonal: eigenvalues are diagonal entries. A^{k} has eigenvalues λ^{k}; A⁻¹ has 1/λ. Symmetric matrices have real eigenvalues.
?? An eigenvalue λ is a number such that Av = λv for some non-zero vector v — the matrix just stretches v. Shortcuts: all eigenvalues add up to the trace (sum of diagonal) and multiply to the determinant. For triangular matrices, simply read them off the diagonal.
- 2×2 shortcut: λ² − (trace)λ + det = 0.
?? For a 2×2 matrix, solve λ² − (a + d)λ + (ad − bc) = 0. E.g. [[4,1],[2,3]]: trace 7, det 10 → λ² − 7λ + 10 = 0 → λ = 2, 5.

# Probability
- P(A ∪ B) = P(A) + P(B) − P(A ∩ B). Independent: P(A ∩ B) = P(A)·P(B).
?? Probability of A or B = P(A) + P(B) minus the overlap (counted twice otherwise). Independent events do not affect each other, so the chance of both is the product, e.g. two coins both heads = ½ × ½.
- Bayes: P(A|B) = P(B|A)P(A) / P(B).
?? Bayes' rule flips a conditional probability. If a test is 99% accurate but the disease is rare (1%), a positive result is only about 50% likely to mean disease, because false alarms from the 99% healthy people are as many as true cases.
| Distribution | Type | Mean | Variance |
?? Know the average (mean) and spread (variance) of the common distributions. Binomial = number of successes in n tries; Poisson = count of rare events in an interval (mean = variance = λ); Exponential = waiting time between such events (mean 1/λ).
|---|---|---|---|
| Bernoulli(p) | Discrete | p | p(1−p) |
| Binomial(n, p) | Discrete | np | np(1−p) |
| Poisson(λ) | Discrete | λ | λ |
| Geometric(p) | Discrete | 1/p | (1−p)/p² |
| Uniform(a, b) | Continuous | (a+b)/2 | (b−a)²/12 |
| Exponential(λ) | Continuous | 1/λ | 1/λ² |
| Normal(μ, σ²) | Continuous | μ | σ² |
- Gaussian, Rayleigh, Exponential are continuous; Poisson/Binomial are discrete.
?? Discrete = takes countable values (0, 1, 2 …), like the number of calls. Continuous = any real value in a range, like a waiting time or a voltage. ISRO 2025 asked which one is discrete → Poisson.

# Calculus
- lim sin x / x = 1; lim (1 − cos x)/x² = 1/2; L'Hôpital for 0/0 and ∞/∞.
?? Standard limits: for tiny x, sin x ≈ x, so sin x / x → 1. When you get 0/0, L'Hôpital says differentiate top and bottom separately and try again.
- Local max: f′ = 0, f″ < 0. Rolle's and Mean value theorems need continuity on [a, b] and differentiability on (a, b).
?? At a peak of a curve the slope is zero (f′ = 0) and the curve bends downward (f″ < 0). The mean value theorem says that somewhere the instant slope equals the average slope — valid only if the function is smooth enough (continuous and differentiable).
- ∫ odd function over [−a, a] = 0 — saves time in triple-integral questions.
?? An odd function satisfies f(−x) = −f(x) (like x or x³). Over a range symmetric around zero, the positive and negative parts cancel, so the integral is 0 — this shortcut kills parts of integrals instantly.

# Number theory
- φ(n) = n Π(1 − 1/p). Fermat: a^{p−1} ≡ 1 (mod p). Euler: a^{φ(n)} ≡ 1 (mod n) when gcd(a, n) = 1.
?? φ(n) counts the numbers from 1 to n that share no factor with n. For a prime p it is p − 1. Fermat/Euler theorems say powers wrap back to 1 modulo n — this is exactly why RSA decryption works.
- Modular inverse: find d with e·d ≡ 1 (mod φ) — RSA questions.
?? A modular inverse of e is a number d with e × d leaving remainder 1 when divided by φ. Check options by multiplying: 7 × 103 = 721 = 6 × 120 + 1 → 103 is the inverse of 7 mod 120.
`);

ISRO.addNotes('toc', 'Theory of Computation', `
# Finite automata
- DFA, NFA, ε-NFA all accept exactly the regular languages. NFA with n states → DFA with ≤ 2ⁿ states.
?? A DFA is a machine that reads a string one symbol at a time, with exactly one move per symbol. An NFA may have several choices (or ε "free" moves). Surprisingly they recognise the same languages; converting NFA → DFA tracks every set of possible states, which can blow up to 2ⁿ states.
- Minimisation: merge indistinguishable states (table filling / Myhill-Nerode). Remove unreachable states first.
?? Two states are "indistinguishable" if every possible future input leads both to accept or both to reject — then they can be merged. The minimal DFA is unique. Delete states that can never be reached from the start first.
- **Minimal DFA sizes you should know instantly:**
?? These are the patterns ISRO repeats. Learning them saves drawing the whole DFA in the exam.
| Language over {a,b} | States |
?? How to read the table: a DFA needs one state per "thing it must remember". Divisible by k → remember the remainder (k possibilities). Ending with w → how much of w matched so far (|w| + 1). n-th from the right → the last n symbols (2ⁿ combinations). Don't forget the dead state where needed.
|---|---|
| Length ≡ 0 mod k (or numbers divisible by k) | k |
| Strings ending with a fixed string w | length(w) + 1 |
| Strings containing substring w | length(w) + 1 |
| n-th symbol from the right is a | 2ⁿ |
| n-th symbol from the left is a | n + 2 |
| Exactly k a's | k + 2 |
| At least k a's | k + 1 |
| All non-empty strings | 2 |
| Empty language / Σ* | 1 |
- Product DFA for "divisible by m AND/OR by n" → lcm-based count (e.g. 4 or 6 → 12).
?? To check two conditions at once, run both small DFAs side by side. For "length divisible by 4 or 6", you only need length mod 12 (the LCM), so 12 states.

# Regular expressions
- (a + b)* = (a*b*)* = (a* + b*)* = (a*b)*a*. (a*b)* + (b*a)* = (a + b)*.
?? Equal regular expressions = describe the same set of strings. (a + b)* is "any string of a's and b's". (a*b)* is any string ending in b (or empty); (b*a)* any ending in a (or empty) — together, all strings.
- Arden: R = Q + RP ⇒ R = QP* (if ε ∉ P).
?? Arden's rule solves an equation like R = Q + RP: R starts with Q and then repeats P any number of times → R = QP*. Used to turn a DFA into a regular expression.
- Closure: regular languages are closed under union, intersection, complement, difference, concatenation, star, reversal, homomorphism, inverse homomorphism, quotient.
?? "Closed under" an operation means: apply it to regular languages and the result is still regular. Regular languages survive almost everything — union, intersection, complement, reverse, etc.

# Context-free languages
- CFG ⇔ NPDA. DPDA accepts DCFL ⊂ CFL. Every regular language is a DCFL.
?? A PDA is a finite automaton plus a stack, giving it unbounded memory in one direction — enough to count matching a's and b's. The non-deterministic PDA matches exactly the context-free languages; the deterministic one is weaker.
- CFLs closed under: union, concatenation, star, reversal, homomorphism, **intersection with regular**. NOT closed under intersection or complement.
?? Context-free languages survive union, concatenation and star, but intersecting two of them can produce something harder (aⁿbⁿcⁿ), and complement can fail too. Intersecting with a regular language is safe.
- DCFL closed under complement; not under union, intersection, concatenation.
?? DCFLs (deterministic) are closed under complement — just swap accept/reject in the deterministic machine — but not under union.
| Language | Class |
?? Classic examples to recognise: aⁿbⁿ needs one counter (a stack) → context-free. wwᴿ (a string followed by its reverse) is context-free but a deterministic machine cannot know where the middle is. ww and aⁿbⁿcⁿ need two counters → not context-free.
|---|---|
| aⁿbⁿ | DCFL, not regular |
| aⁿbⁿ ∪ aⁿb²ⁿ | CFL, not DCFL |
| wcwᴿ | DCFL |
| wwᴿ, palindromes | CFL, not DCFL |
| ww | Not CFL (CSL) |
| aⁿbⁿcⁿ | Not CFL (CSL) |
| aᵐbⁿ, m ≠ n | CFL |
| a^{n²}, a^{prime}, a^{2ⁿ} | Not CFL (CSL) |
- **Template (asked 2023 and 2025):** S → aSb | T, T → bT | b ⇒ {aᵐbⁿ : 0 ≤ m < n}.
?? This exact grammar appeared in both 2023 and 2025! S → aSb adds an a on the left and a b on the right together; T then adds at least one extra b. So there are always more b's than a's: aᵐbⁿ with m < n (m can be 0).
- Ambiguous grammar: some string has ≥ 2 parse trees ⇔ ≥ 2 leftmost ⇔ ≥ 2 rightmost derivations. E → E+E | E×E | id is ambiguous ("id+id×id" has exactly 2 trees).
?? A grammar is ambiguous if one string can be parsed in two different ways (two trees). For id + id × id you can do + first or × first — exactly 2 trees. Real compilers fix this with precedence rules.
- CNF: A → BC | a; a string of length n takes 2n − 1 steps. GNF: A → aα; n steps.
?? Normal forms are standard shapes for grammar rules. In Chomsky Normal Form each rule makes two non-terminals or one terminal, so a string of n letters always takes 2n − 1 steps. In Greibach form each step produces exactly one letter → n steps.
- Pumping lemma shows a language is NOT regular/CFL; it can never prove regularity.
?? The pumping lemma says every long string in a regular language has a part that can be repeated. If you find a language where repeating breaks it (like aⁿbⁿ), the language is not regular. It can only prove "NOT regular", never "regular".

# Turing machines & decidability
- Chomsky hierarchy: Type 3 regular (FA) ⊂ Type 2 CFL (PDA) ⊂ Type 1 CSL (LBA) ⊂ recursive ⊂ Type 0 RE (TM).
?? The Chomsky hierarchy: bigger machines recognise more languages. Finite automaton < pushdown automaton < linear-bounded automaton < Turing machine. Each class contains the previous one.
- Recursive (decidable): TM halts on every input. RE: TM halts on members (may loop otherwise).
?? A Turing machine is the most powerful model of computation. "Recursive/decidable" = there is a TM that always stops and says yes or no. "Recursively enumerable" = a TM says yes for members but may run forever on non-members.
- Recursive closed under complement; RE not. L and L′ both RE ⇒ L recursive. L RE but not recursive ⇒ L′ not RE.
?? If you can semi-decide both L and its complement, run both machines in parallel — one must stop — so L is decidable. The halting problem is RE but not decidable, so its complement is not even RE.
| Problem | Regular | CFL | CSL | RE |
?? Which questions about languages can a computer always answer? D means an algorithm exists, U means it provably does not. Regular languages: everything decidable. CFLs: membership and emptiness decidable, but equivalence and ambiguity are not.
|---|---|---|---|---|
| Membership | D | D | D | U |
| Emptiness | D | D | U | U |
| Finiteness | D | D | U | U |
| Equivalence | D | U | U | U |
| Ambiguity | — | U | — | — |
(D = decidable, U = undecidable)
?? Legend for the table above: D = an algorithm that always answers exists; U = no such algorithm can exist.
- Rice's theorem: any non-trivial property of the language of a TM is undecidable. PCP is undecidable.
?? Rice's theorem: any interesting question about what a program does ("does it ever print 5?", "does it accept an even string?") is undecidable. PCP is a domino puzzle that is also undecidable — used to prove other problems undecidable.
- Two-stack PDA = TM; queue automaton = TM; multi-tape/non-deterministic TMs add no power.
?? Adding a second stack to a PDA makes it as powerful as a Turing machine (two stacks can simulate a tape). Extra tapes or non-determinism make a TM faster or more convenient, but not able to solve new problems.
`);

ISRO.addNotes('cd', 'Compiler Design', `
# Phases
1. Lexical analysis → tokens (uses regex/DFA; tool: lex/flex)
?? The lexer (scanner) reads raw characters and groups them into tokens like keyword "int", identifier "x", number "10". It uses regular expressions turned into DFAs; lex/flex generate it automatically.
2. Syntax analysis → parse tree (CFG; tool: yacc/bison)
?? The parser checks the tokens follow the grammar of the language (like grammar of a sentence) and builds a parse tree. yacc/bison generate parsers from grammar rules.
3. Semantic analysis → type checking, scope (annotated tree)
?? Semantic analysis checks meaning: are variables declared, do types match (adding an int to a string?), are function calls given the right arguments.
4. Intermediate code generation → three-address code
?? Intermediate code is a simple, machine-independent form such as three-address code (t1 = a + b). It makes optimisation and supporting many processors easier.
5. Code optimisation
?? Optimisation makes the intermediate code faster or smaller without changing what it does (e.g. computing 3 × 4 at compile time).
6. Target code generation
?? Finally the code generator turns the optimised code into actual machine instructions and decides which values live in registers.
- Symbol table and error handler interact with all phases. Front end = 1–4 (language dependent); back end = 5–6 (machine dependent).
?? The symbol table stores every name (variable, function) with its type and scope; all phases read/write it. The front end understands the source language; the back end knows the target machine — so you can mix and match.
- Errors: illegal character → lexical; missing ; or unbalanced parentheses → syntax; type mismatch, undeclared variable → semantic.
?? Which phase catches which mistake: a stray @ in a name is a lexical error; a missing semicolon is a syntax error; using an undeclared variable or adding incompatible types is a semantic error.
- Token counting: keywords, identifiers, operators, constants, punctuation each count 1; a whole string literal is 1 token; comments and whitespace are dropped.
?? To count tokens, split the line into meaningful pieces: in printf("i = %d", i); → printf, (, the whole string, ",", i, ), ; = 7. Spaces and comments are thrown away.

# Parsing
## Top-down
- Recursive descent / LL(1): needs no left recursion (A → Aα | β ⇒ A → βA′, A′ → αA′ | ε) and left factoring.
?? Top-down parsers start from the start symbol and guess which rule to use. A rule like A → A α (left recursion) makes them call themselves forever, so it must be rewritten. Left factoring removes common prefixes so one lookahead symbol is enough to choose.
- LL(1) condition: for A → α | β, FIRST(α) ∩ FIRST(β) = ∅, and if α ⇒* ε then FIRST(β) ∩ FOLLOW(A) = ∅.
?? LL(1) works only if, looking at the next input symbol, there is never a choice between two rules. That is guaranteed when the sets of first symbols of the alternatives do not overlap.
- LL(1): scan Left-to-right, Leftmost derivation, 1 lookahead.
?? LL(1) is read as: L = read input Left to right, L = build a Leftmost derivation, 1 = look one token ahead.
- FIRST: terminals that can begin a string derived from X (include ε if X ⇒* ε). FOLLOW: terminals that can appear right after A; $ ∈ FOLLOW(start).
?? FIRST(X) = which terminals can appear first in anything X produces. FOLLOW(A) = which terminals can appear right after A in some sentence. These two sets fill the LL(1) table. $ means end of input.

## Bottom-up
- Shift-reduce: finds handles, produces the **rightmost derivation in reverse**.
?? Bottom-up parsers start from the input and repeatedly "reduce" a piece that matches the right side of a rule (the handle) into its left side, until only the start symbol remains. Reading those steps backwards gives a rightmost derivation.
- Power: LR(0) < SLR(1) < LALR(1) < CLR(1). Every LL(1) grammar is LR(1) (not necessarily LALR(1)).
?? The LR family from weakest to strongest: LR(0), SLR(1), LALR(1), canonical LR(1). Stronger means it can handle more grammars without conflicts. yacc uses LALR(1) — a good balance of power and table size.
- #states: LR(0) = SLR = LALR ≤ CLR.
?? LALR merges canonical LR states that look the same apart from lookaheads, so it ends up with the same number of states as SLR — far fewer than canonical LR.
- Merging CLR states into LALR can create reduce-reduce conflicts, never new shift-reduce conflicts.
?? When LALR merges states, their lookahead sets combine, so two reductions might now apply on the same symbol (reduce-reduce conflict). Shift-reduce conflicts cannot newly appear because the shifting part was identical in both states.
- SLR reduces A → α· on FOLLOW(A); CLR/LALR on the item's lookahead.
?? Deciding when to reduce: SLR reduces whenever the next symbol is in FOLLOW(A) — a rough rule. LALR/CLR carry exact lookaheads per item — more precise, fewer conflicts.
- Operator precedence grammar: no ε-productions and no two adjacent non-terminals.
?? Operator-precedence parsing (for expressions) requires that no rule produces empty and no rule has two non-terminals side by side, like E → E E.
- Ambiguous grammars are neither LL(k) nor LR(k).
?? An ambiguous grammar gives two possible parses, so no deterministic LL or LR parser can be built for it without extra rules.

# Syntax-directed translation
- Synthesized attributes: from children; inherited: from parent/left siblings.
?? Attributes attach values to parse-tree nodes. Synthesized ones are computed from children (e.g. the value of an expression from its parts); inherited ones come from the parent or siblings on the left (e.g. a declared type passed down to each variable).
- S-attributed (only synthesized) → evaluated bottom-up. L-attributed (inherited from left only) → one left-to-right pass. S-attributed ⊂ L-attributed.
?? S-attributed grammars use only synthesized attributes, so values can be computed while a bottom-up parser reduces. L-attributed allow inherited ones from the left, so a single left-to-right pass still works.

# Intermediate code
- Three-address code: x = y op z. Representations: quadruples (op, arg1, arg2, result), triples (no result field, refer by position), indirect triples (list of pointers — easy reordering).
?? Three-address code has at most one operator per instruction. Quadruples store (operator, operand1, operand2, result). Triples skip the result and refer to earlier lines by number. Indirect triples add a list of pointers so lines can be reordered easily during optimisation.
- SSA: every variable assigned once (φ-functions at joins). DAG of a basic block exposes common subexpressions.
?? SSA (Static Single Assignment) renames variables so each is assigned only once (x1, x2…), which makes optimisation analysis simpler. A DAG drawing of a block shows when the same calculation is repeated.
- Basic block leaders: first statement, any jump target, statement following a jump.
?? A basic block is a straight run of code with no jumps in or out in the middle. A new block starts at the first line, at any line that is a jump target, and right after any jump.

# Optimisation
| Technique | Example |
?? Common compiler optimisations with examples. Key idea for each: do work at compile time (folding), avoid repeating work (CSE, code motion), remove useless work (dead code), or replace expensive operations with cheap ones (strength reduction: multiply → shift).
|---|---|
| Constant folding | 3*4 → 12 |
| Constant / copy propagation | x = 5; y = x+1 → y = 6 |
| Common subexpression elimination | a*b computed once |
| Dead code elimination | remove unused assignments, unreachable code |
| Strength reduction | x*2 → x<<1; i*4 in loop → add |
| Loop invariant code motion | move constant computation out of loop |
| Loop unrolling / fusion / jamming | fewer branches |
| Peephole | redundant load/store, jump-to-jump |
- Data-flow: reaching definitions & available expressions → forward; live variables & very busy expressions → backward.
?? Data-flow analysis tracks facts through the program. "Which assignments can reach this line?" flows forward. "Will this variable be used later?" (liveness) flows backward from the end.
- Register allocation = graph colouring of the interference graph.
?? Variables that are alive at the same time cannot share a register. Draw a graph with an edge between such variables and colour it with k colours = k registers. Uncolourable → spill a variable to memory.

# Runtime
- Activation record: return value, actual parameters, control link (caller's AR), access link (non-local data), saved machine status, locals, temporaries.
?? Each function call gets an activation record on the stack holding its parameters, local variables, return address and links to the caller. Popping it on return frees all that memory instantly.
- Static allocation cannot support recursion; stack allocation can; heap for dynamic data.
?? Static allocation fixes every variable's address at compile time, so a recursive function's second call would overwrite the first one's locals — recursion needs the stack. The heap is for data created with malloc/new.
- Cross compiler: runs on host, produces code for target (e.g. on-board processors). Bootstrapping: compiler written in its own language. JIT: compile at run time (JVM, .NET).
?? A cross compiler runs on one machine but produces code for a different one — e.g. compiling flight software on a PC for a satellite processor. A JIT (just-in-time) compiler compiles while the program runs, as Java does.
`);

ISRO.addNotes('os', 'Operating Systems', `
# Processes and threads
- States: New → Ready → Running → (Waiting → Ready) → Terminated. Running → Ready on preemption. **Waiting → Running is impossible** (must go through Ready).
?? A process (running program) moves between states. Ready = waiting for the CPU. Running = on the CPU. Waiting = waiting for something else, like disk I/O. When the I/O finishes it goes back to Ready (not straight to Running) — only the scheduler puts a process on the CPU.
- PCB: PID, state, PC, registers, scheduling info, memory-management info, open files, accounting.
?? The Process Control Block is the OS's "file" on each process: its ID, state, where it was in the code (program counter), saved register values, memory info and open files. On a switch the OS saves one PCB and loads another.
- fork(): returns 0 in child, child PID in parent, −1 on error. n sequential forks → 2ⁿ processes (2ⁿ − 1 children). exec() replaces the image; wait() reaps children.
?? fork() makes a copy of the running process. Both copies continue from the same line; the child sees 0 as the return value, the parent sees the child's ID. Every fork doubles the number of processes, so 3 forks in a row → 2³ = 8.
- Zombie: terminated, entry still in process table until the parent calls wait(). Orphan: parent exited first, adopted by init.
?? A zombie is a finished child whose parent has not yet collected its exit status (with wait()) — it holds only a table entry. An orphan is a still-running child whose parent died; the init process adopts it.
- Threads share code, data, heap, files; each has its own stack, registers, PC. Models: many-to-one (one blocking call blocks all), one-to-one (Linux, Windows), many-to-many.
?? Threads are lighter "mini-processes" inside one process. They share the program's memory and files but each has its own stack and register values, so each can be at a different place in the code. Linux maps each user thread to its own kernel thread (one-to-one).

# CPU scheduling
- TAT = Completion − Arrival; WT = TAT − Burst; Response = First run − Arrival.
?? Turnaround = total time from arrival to finish. Waiting = turnaround minus the time actually spent running. Response = how long until it first gets the CPU. Most scheduling numericals ask for averages of these.
| Algorithm | Preemptive | Notes |
?? Scheduling algorithms decide which ready process runs next. Preemptive = the OS can take the CPU away mid-run. Key facts: SJF gives the lowest average waiting time but long jobs may starve; Round Robin gives each process a time slice in turn — fair and good for interactive use.
|---|---|---|
| FCFS | No | Convoy effect |
| SJF | No | Optimal avg WT for given set; starvation |
| SRTF | Yes | Preemptive SJF |
| Priority | Either | Starvation → aging |
| Round robin | Yes | Large q → FCFS; small q → overhead |
| MLQ / MLFQ | Yes | Feedback lets processes move between queues |
- Schedulers: long-term (job admission, degree of multiprogramming), medium-term (swapping), short-term (CPU dispatcher; runs most often, must be fast).
?? Three schedulers: long-term decides how many jobs are allowed into memory; medium-term temporarily swaps processes out to disk; short-term picks which ready process gets the CPU next — it runs every few milliseconds, so it must be very fast.
- Real-time: Rate Monotonic (shorter period ⇒ higher priority, U ≤ n(2^{1/n} − 1)); EDF (U ≤ 1). Priority inversion → priority inheritance / ceiling protocol (Mars Pathfinder).
?? Real-time systems (rockets, satellites) must meet deadlines. Rate Monotonic gives fixed higher priority to tasks that repeat more often. Priority inversion is when a high-priority task waits for a lock held by a low one; the fix is to temporarily raise the low task's priority (inheritance).
> Always draw the Gantt chart. Check whether the CPU is idle at the start (first arrival may be > 0).
?? A Gantt chart is a time-line bar showing which process runs when. Drawing it makes completion times obvious. Watch out: if the first process arrives at time 2, the CPU is idle from 0 to 2.

# Synchronisation
- Race condition: outcome depends on interleaving. Critical-section requirements: mutual exclusion, progress, bounded waiting.
?? A race condition happens when two processes update shared data at the same time and the result depends on who goes first (like two people withdrawing from the same account). A correct solution must allow only one inside the critical section, not block when nobody is inside, and not make anyone wait forever.
- Peterson's algorithm (2 processes): flag[i] = true; turn = j; while(flag[j] && turn == j);
?? Peterson's algorithm lets two processes take turns safely using two flags ("I want to enter") and a turn variable ("you go first"). A process waits only if the other wants to enter and it is the other's turn.
- Semaphore S: wait/P decrements (blocks if < 0 in blocking impl.), signal/V increments. Counting semaphore final value = initial − #P + #V.
?? A semaphore is a counter with two atomic operations: wait (P) decreases it and blocks if nothing is available; signal (V) increases it. Think of it as tokens for a resource. Final value = start − number of waits + number of signals.
- Producer-consumer: semaphores empty = N, full = 0, mutex = 1. Producer: wait(empty), wait(mutex) … signal(mutex), signal(full). Wrong order of waits can deadlock.
?? Producer-consumer: "empty" counts free slots (starts at N), "full" counts filled slots (starts at 0), and "mutex" protects the buffer. The producer waits for an empty slot before locking; if it locked first and then waited, it could block while holding the lock → deadlock.
- Spinlock = busy waiting (fine on multiprocessors, short sections). Monitor: only one process active inside; condition variables.
?? A spinlock waits by looping ("is it free yet?") — wasteful, but fine for very short waits on multi-core CPUs. A monitor is a language construct where only one process can be inside at a time, with condition variables to wait for events.

# Deadlock
- Necessary conditions (all four): mutual exclusion, hold and wait, no preemption, circular wait.
?? Deadlock = processes each holding something and waiting for something another holds, forever. All four conditions must be true at once; breaking any one prevents deadlock.
- Prevention breaks a condition (e.g. resource ordering kills circular wait); avoidance = Banker's algorithm (safe state); detection = wait-for graph cycle (single instance).
?? Three strategies: prevention (design so a condition can never hold, e.g. always grab resources in a fixed order), avoidance (Banker's algorithm only grants requests that keep the system safe), detection (let it happen, find the cycle, kill/rollback a process).
- RAG with single instances: cycle ⇔ deadlock. Multiple instances: cycle is necessary, not sufficient.
?? In a resource allocation graph, arrows show "process waits for resource" and "resource held by process". If each resource has one copy, a cycle means deadlock for sure. With several copies, a cycle might still resolve.
- n processes each needing at most k units: deadlock impossible if R ≥ n(k − 1) + 1.
?? Worst case: every process holds k − 1 units and wants one more. If there is even one extra unit (n(k − 1) + 1 total), someone can finish and release theirs, so deadlock is impossible.
> Banker's: Need = Max − Allocation. Repeatedly find a process with Need ≤ Available; add its Allocation to Available.
?? Banker's algorithm: Need is what each process may still ask for. Pretend to run any process whose Need fits in Available; when it finishes it returns its Allocation. If all processes can finish this way, the state is safe.

# Memory management
- Contiguous allocation: first fit (fast), best fit (smallest leftover), worst fit, next fit. External fragmentation → compaction or paging.
?? Contiguous allocation gives each process one continuous block. First fit takes the first hole big enough; best fit the smallest hole that fits; worst fit the largest. Over time memory gets chopped into small unusable gaps (external fragmentation).
- Paging: logical address = page number + offset. #pages = 2^{logical bits}/page size. Page table size = #pages × PTE size. Internal fragmentation only (last page).
?? Paging splits memory into equal fixed-size pieces: pages (in the program) and frames (in RAM). The address's high bits give the page number, the low bits the offset within the page. Only the last page of a process may be partly empty (internal fragmentation).
- Multi-level paging cuts page-table memory; inverted page table has one entry per frame.
?? A single page table for a 32-bit address space can be 4 MB per process. Multi-level paging only creates the parts actually used. An inverted table has one entry per physical frame, instead of per virtual page.
- EAT with TLB (hit ratio h, TLB t, memory m): h(t + m) + (1 − h)(t + 2m).
?? The TLB is a tiny fast cache of recent page-table entries. On a hit you pay TLB time + one memory access; on a miss you also read the page table from memory (an extra memory access). Weight each case by its probability.
- Segmentation: (segment, offset), segment table has base and limit; external fragmentation. Loader assigns segment numbers.
?? Segmentation divides a program into logical pieces (code, data, stack) of different sizes; each segment has a base address and a length limit. Variable sizes cause external fragmentation.

# Virtual memory
- Demand paging EAT = (1 − p)·m + p·(page-fault service time).
?? With demand paging, a page is loaded only when used. If p is the chance of a page fault, average access = normal memory time most of the time plus, occasionally, a very slow disk read. Even a tiny p hurts because disk is millions of times slower.
- Replacement: FIFO (Belady's anomaly), Optimal (look ahead, minimum faults), LRU, LFU, clock/second chance (LRU approximation). LRU and OPT are stack algorithms — no Belady's anomaly.
?? Page replacement picks which page to evict when memory is full. Optimal evicts the page needed furthest in the future (best, but needs the future). LRU evicts the least recently used. FIFO evicts the oldest — and can strangely get MORE faults with more frames (Belady's anomaly).
- Thrashing: high paging, low CPU utilisation → reduce multiprogramming, working-set model, page-fault-frequency control.
?? Thrashing: too many processes, too little memory each, so the system spends all its time swapping pages and the CPU sits idle. The cure is to run fewer processes or give each enough frames for its working set.
- Copy-on-write makes fork() cheap. Dirty bit avoids writing clean pages back.
?? Copy-on-write: after fork the parent and child share the same pages until one of them writes, then only that page is copied — so fork is fast. The dirty bit marks pages that were changed; clean pages need not be written back to disk.

# Disk & files
- Access time = seek + rotational latency (avg = half rotation = 30/RPM s) + transfer.
?? Reading a disk: move the arm to the track (seek), wait for the sector to spin under the head (on average half a turn), then transfer. At 7200 RPM one turn = 8.33 ms, so average rotational wait ≈ 4.17 ms.
- Disk scheduling: FCFS, SSTF (starvation), SCAN (elevator, to the end), LOOK (to last request), C-SCAN/C-LOOK (one direction, uniform wait).
?? Disk scheduling orders requests to reduce arm movement. SSTF serves the nearest request (efficient but far requests may starve). SCAN moves like a lift to the end then reverses. C-SCAN only serves in one direction and jumps back — more even waiting times.
- Allocation: contiguous (fast, external fragmentation), linked (no random access; FAT is a table version), indexed (inode).
?? Ways to place a file on disk: contiguous (one run of blocks — fast but fragments), linked (each block points to the next — no random access), indexed (an index block lists all blocks, like a book index).
- UNIX inode: metadata + 12 direct + single + double + triple indirect. Pointers per block = block size / pointer size. File name is in the directory entry, not the inode.
?? The inode holds a file's metadata and block addresses: 12 point directly to data; the single-indirect points to a block full of addresses, and so on. With 4 KB blocks and 4-byte pointers, one block holds 1024 addresses. The name is stored in the directory, not in the inode.
- Hard link → same inode, same file system; soft link → path, can dangle/cross FS.
?? A hard link is a second name for the same inode — the file survives until all names are deleted. A soft (symbolic) link stores a path like a shortcut; if the target is deleted, the link dangles.

# Other
- Kernel vs user mode (mode bit); privileged instructions: I/O, timer, interrupt disable, MMU registers.
?? The CPU has a mode bit: user programs run in user mode and cannot do dangerous things (direct I/O, change timers, disable interrupts). Only the kernel, in kernel mode, can execute these privileged instructions.
- Interrupt (async, hardware) vs trap/exception (sync, software — system call, divide by zero, illegal access). Illegal memory access → trap to OS.
?? An interrupt comes from hardware at any time (keyboard, timer). A trap is caused by the running program itself — a system call, divide by zero, or touching memory it does not own. The OS handles both.
- I/O: programmed (polling), interrupt-driven, DMA. Spooling buffers jobs for slow devices.
?? Programmed I/O: the CPU keeps checking the device (wastes time). Interrupt-driven: the device signals when ready. DMA: a separate controller copies a whole block to memory and interrupts once at the end. Spooling queues output (e.g. print jobs) on disk.
- Fastest IPC: shared memory. Message passing easier for distributed systems.
?? Shared memory lets processes read/write the same RAM area directly — the fastest way to exchange data, but they must synchronise. Message passing (send/receive) is slower but simpler and works across machines.
`);

ISRO.addNotes('cn', 'Computer Networks', `
# Layering
| OSI | Unit | Devices / protocols |
?? The OSI model splits networking into 7 layers, each with one job. Mnemonic from bottom: "Please Do Not Throw Sausage Pizza Away". Physical moves bits on wires, Data link moves frames between neighbours, Network routes packets across networks, Transport delivers end-to-end reliably, upper layers deal with sessions, formats and apps.
|---|---|---|
| 7 Application | Data | HTTP, FTP, SMTP, DNS, SNMP |
| 6 Presentation | Data | Encryption, compression, encoding |
| 5 Session | Data | Session control, checkpoints |
| 4 Transport | Segment | TCP, UDP — ports, end-to-end |
| 3 Network | Packet | IP, ICMP, routers, OSPF/RIP/BGP |
| 2 Data link | Frame | Ethernet, switches, bridges, ARP*, PPP |
| 1 Physical | Bit | Hubs, repeaters, cables |
- Wrong default gateway → Layer 3 problem. Switch: each port its own collision domain, one broadcast domain. Router separates broadcast domains.
?? The default gateway is the router your computer sends outside traffic to, so a wrong gateway is a layer-3 (network) problem. A switch gives each port its own collision domain; a router also splits broadcast domains.

# Physical layer
- Nyquist (noiseless): C = 2B log₂ L. Shannon (noisy): C = B log₂(1 + SNR); SNR(dB) = 10 log₁₀ SNR.
?? Two formulas for the maximum data rate. Nyquist (no noise): with bandwidth B and L signal levels → 2B log₂ L bits/s. Shannon (with noise): B log₂(1 + signal/noise). E.g. 3 kHz with SNR 1023 → 3000 × 10 = 30 kbps.
- Manchester: transition every bit → baud = 2 × bit rate. Fibre is immune to EMI.
?? Manchester encoding puts a transition in the middle of every bit so the receiver can stay synchronised — but this needs twice the signal changes. Optical fibre carries light, so electrical interference cannot affect it.

# Data link layer
- Error detection: parity (odd # of bit errors), checksum, CRC (degree-r generator appends r bits; detects all bursts ≤ r). Error correction: Hamming, Reed-Solomon, LDPC, convolutional/Turbo.
?? Detection only tells you "something is wrong" (then you resend). Parity misses an even number of flipped bits. CRC is a strong check used in Ethernet. Correction codes (Hamming, Reed-Solomon, LDPC) add enough extra bits to fix errors without resending — vital for satellite links.
- Hamming: r parity bits for m data bits: 2^{r} ≥ m + r + 1. Detect d errors → d_min ≥ d + 1; correct d errors → d_min ≥ 2d + 1.
?? Hamming distance = number of bit positions where two codewords differ. To detect d errors codewords must be at least d + 1 apart; to correct d, at least 2d + 1 apart. For 4 data bits you need 3 parity bits (Hamming(7,4)).
- Bit stuffing: insert 0 after five consecutive 1s (flag 01111110).
?? Frames start and end with the flag 01111110. If the data itself contains five 1s in a row, the sender inserts a 0 so the data can never look like a flag; the receiver removes it.

## Flow control
- a = Tp / Tt. Stop-and-wait efficiency = 1/(1 + 2a). Window N: min(1, N/(1 + 2a)).
?? a = propagation delay ÷ transmission time. In stop-and-wait the sender sends one frame and waits a full round trip for the ACK, so the link is idle most of the time when a is large. Sending N frames per round trip multiplies efficiency by N (up to 100%).
- Sequence numbers with n bits: GBN sender window ≤ 2ⁿ − 1 (receiver 1); Selective Repeat ≤ 2ⁿ⁻¹ each.
?? With n-bit sequence numbers, Go-Back-N can have up to 2ⁿ − 1 frames outstanding; Selective Repeat only half the number space (2ⁿ⁻¹) so the receiver can tell new frames from retransmissions.
- Window needed for full utilisation ≈ 1 + 2a; in bytes ≈ bandwidth × RTT.
?? To keep the pipe full, the sender must have enough data in flight to cover a whole round trip: bandwidth × RTT bytes (the bandwidth-delay product).

## Medium access
- Pure ALOHA max 18.4% (1/2e), slotted ALOHA 36.8% (1/e).
?? ALOHA = transmit whenever you like; collisions waste time. At best only 18.4% of the channel is useful. Slotted ALOHA forces sending at slot starts, halving collisions → 36.8%.
- CSMA/CD (Ethernet): Tt ≥ 2·Tp ⇒ minimum frame = 2 × bandwidth × propagation delay. Backoff after n-th collision: K ∈ [0, 2ⁿ − 1].
?? In CSMA/CD the sender must still be transmitting when a collision signal comes back, so a frame must last at least one round trip: minimum frame = 2 × bandwidth × propagation delay. After collisions, stations wait a random time that grows each time.
- CSMA/CA (Wi-Fi): RTS/CTS, solves hidden terminal.
?? In Wi-Fi a station cannot hear collisions while transmitting, so it avoids them: wait, then optionally reserve the channel with Request-To-Send / Clear-To-Send. CTS also warns hidden stations that cannot hear the sender.
- Ethernet: frame 64–1518 bytes, payload 46–1500; MAC 48 bits.
?? Ethernet frame sizes: minimum 64 bytes (needed for collision detection), maximum 1518 bytes; data inside 46–1500 bytes. A MAC address (hardware address) is 48 bits, e.g. 3C:52:82:1A:2B:9F.
- 802.11: b 11 Mbps (2.4 GHz), a/g 54 Mbps, n 600 Mbps, ac ~3.5–6.9 Gbps (5 GHz), ad 7 Gbps (60 GHz), ax (Wi-Fi 6) 9.6 Gbps.
?? Wi-Fi standard speeds — ISRO 2023 asked to match these. Higher letters are generally newer and faster; "ad" uses 60 GHz for very fast short-range links.

# Network layer
## IPv4 addressing
| Class | First octet | Default mask |
?? Old class system: the first number of an IP tells its class and default network size. Class A (1–126) has huge networks (/8), C (192–223) small ones (/24). D is for multicast. Today CIDR (/n) is used instead, but questions still ask about classes.
|---|---|---|
| A | 1–126 | /8 |
| B | 128–191 | /16 |
| C | 192–223 | /24 |
| D (multicast) | 224–239 | — |
| E (reserved) | 240–255 | — |
- Private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Loopback 127.0.0.0/8. APIPA 169.254/16.
?? Private addresses are for internal networks and are not routed on the Internet (NAT translates them). 127.0.0.1 always means "this computer" (loopback).
- /n prefix → 2^{32−n} addresses, 2^{32−n} − 2 usable hosts. Block size in the interesting octet = 256 − mask octet.
?? A /n prefix fixes the first n bits; the remaining 32 − n bits number hosts. Subtract 2 because the all-zeros (network) and all-ones (broadcast) addresses are not usable. /26 → 64 − 2 = 62 hosts. Block size trick: mask 255.255.255.192 → 256 − 192 = 64.
> /26 → block 64: .0, .64, .128, .192. 10.0.0.126 and 10.0.0.131 are in different /26 subnets → router needed.
?? With /26, subnets start every 64: .0, .64, .128, .192. .126 falls in the .64 subnet and .131 in the .128 subnet — different networks, so they need a router to talk.
- Network address = IP AND mask; broadcast = network with all host bits 1.
?? Network address = keep the network bits, set host bits to 0 (bitwise AND with the mask). Broadcast address = set all host bits to 1. E.g. 192.168.10.77/27 → network .64, broadcast .95.

## IP header & fragmentation
- Header 20–60 bytes; total length 16 bits (max 65,535); TTL; protocol (6 TCP, 17 UDP, 1 ICMP); fragment offset in 8-byte units; MF flag.
?? The IPv4 header carries delivery info. TTL is decreased by every router; at 0 the packet is dropped (stops infinite loops). The fragment offset is counted in 8-byte units, which is why fragment sizes must be multiples of 8.
- Fragment data size must be a multiple of 8 (except the last): MTU 1500 → 1480 data bytes per fragment.
?? If a packet is bigger than a link's MTU it is split into fragments. With MTU 1500 and a 20-byte header, each fragment carries 1480 data bytes (a multiple of 8). The last fragment carries whatever remains.
- IPv6: 128-bit, 40-byte fixed header, no checksum, fragmentation only at source, min MTU 1280.
?? IPv6 uses 128-bit addresses (huge space), a simpler fixed 40-byte header, and routers never fragment — the sender must find the path MTU itself.

## Routing & support protocols
- Distance vector (RIP, Bellman-Ford, hop limit 15, count-to-infinity → split horizon, poison reverse). Link state (OSPF, Dijkstra, flooding of LSAs). Path vector (BGP between ASes).
?? Routing protocols. Distance vector (RIP): each router tells neighbours its distances — simple but slow to notice failures ("count to infinity"). Link state (OSPF): every router learns the full map and runs Dijkstra. BGP connects different organisations' networks on the Internet.
- ARP: IP → MAC (broadcast request). RARP: MAC → IP. DHCP: UDP 67/68, DORA. NAT: private ↔ public, PAT uses ports.
?? ARP finds the hardware (MAC) address for an IP on the local network by shouting "who has 10.0.0.5?". DHCP automatically gives a computer its IP address (Discover, Offer, Request, Acknowledge). NAT lets many private devices share one public IP.
- ICMP: echo (ping), time exceeded (traceroute), destination unreachable / fragmentation needed (**Path MTU discovery breaks if ICMP is blocked**).
?? ICMP carries network control messages: ping uses echo request/reply; traceroute uses "time exceeded". Path MTU discovery relies on ICMP "too big" messages, so a firewall blocking all ICMP breaks it (ISRO 2025 Q39).

# Transport layer
- UDP header 8 bytes; TCP header 20–60 bytes.
?? UDP adds just ports, length and checksum (8 bytes) — fast, no guarantees. TCP adds sequence numbers, acknowledgements, windows (20+ bytes) — reliable and ordered.
- TCP: 3-way handshake (SYN, SYN-ACK, ACK); 4-way close; TIME_WAIT = 2·MSL. Flags: SYN, ACK, FIN, RST, PSH, URG.
?? Opening a TCP connection: client SYN ("let's talk"), server SYN-ACK ("ok, me too"), client ACK. Closing uses FIN/ACK in each direction. The side that closes first waits in TIME_WAIT to catch late packets.
- Flow control: receiver window (rwnd, 16-bit → 64 KB; window scaling for more). Congestion control: slow start (exponential to ssthresh), congestion avoidance (+1 MSS/RTT), timeout → ssthresh = cwnd/2, cwnd = 1 (Tahoe); 3 dup ACKs → fast retransmit/recovery (Reno: cwnd = ssthresh).
?? Flow control stops the sender from overrunning the receiver (receiver's advertised window). Congestion control stops it from overloading the network: start slowly but double each RTT, then grow by one segment per RTT; on loss, cut back sharply.
- Sender window = min(cwnd, rwnd). Ideal window = BDP = bandwidth × RTT (e.g. 8,192,000 bps × 32 ms = 32,768 bytes).
?? The sender may only have min(cwnd, rwnd) bytes unacknowledged. To use the full link, the window should equal bandwidth × round-trip time.

# Application layer
| Protocol | Port | Transport |
?? Well-known port numbers — frequently asked. Memorise SSH 22, SMTP 25, DNS 53, HTTP 80, HTTPS 443, and that DNS/DHCP/SNMP/TFTP use UDP while most others use TCP.
|---|---|---|
| FTP | 20 data, 21 control | TCP |
| SSH / SFTP | 22 | TCP |
| Telnet | 23 | TCP |
| SMTP | 25 (587) | TCP |
| DNS | 53 | UDP (TCP for zone transfer) |
| DHCP | 67/68 | UDP |
| TFTP | 69 | UDP |
| HTTP / HTTPS | 80 / 443 | TCP (HTTP/3 on QUIC/UDP) |
| POP3 / IMAP | 110 / 143 | TCP |
| SNMP | 161/162 | UDP |
| BGP | 179 | TCP |
- DNS resolves names; DNSSEC adds signatures (integrity), not encryption.
?? DNS translates names like isro.gov.in to IP addresses. DNSSEC adds digital signatures so answers cannot be faked, but anyone can still read them — it gives integrity, not confidentiality.
- Satellite: GEO ≈ 36,000 km → one-way up+down ≈ 240 ms, RTT ≈ 480 ms → huge BDP, needs large TCP windows.
?? A geostationary satellite is about 36,000 km up. The signal must go up and down: 72,000 km at the speed of light ≈ 0.24 s one way, about half a second round trip. So TCP needs a very large window to keep such a link busy.
`);

ISRO.addNotes('dbms', 'DBMS', `
# ER model → relations
- Strong entity → table. Weak entity → table with owner's key + partial key (discriminator).
?? In an ER diagram, a strong entity (like Employee) has its own key and becomes a table. A weak entity (like Dependent of an employee) cannot be identified alone, so its table includes the owner's key plus its own partial key.
- 1:1 → FK on either side (total participation side preferred). **1:N → FK on the N side.** M:N → separate table.
?? Converting relationships: one-to-many (one author, many books) — put the author's key as a foreign key in the books table. Many-to-many (students and courses) needs a separate table holding both keys.
- Multivalued attribute → separate table. Minimum tables for A, B with a 1:N R1 and an M:N R2 → 3.
?? An attribute with several values (an employee's many phone numbers) gets its own table. ISRO 2025: two entities + a 1:N (merged into B) + an M:N (own table) → 3 tables.
- ER diagram gives a static view. Three-schema: external / conceptual / internal. Logical data independence is harder than physical.
?? An ER diagram shows the data structure, not behaviour — a static view. The three-schema architecture separates how users see data, the overall logical design, and physical storage, so one can change without breaking the others.

# Keys
- Superkey ⊇ candidate key (minimal) ⊇ primary key (chosen; not NULL). Alternate key = other candidate keys.
?? A superkey is any set of columns that uniquely identifies a row. A candidate key is a minimal superkey (remove any column and it stops being unique). The primary key is the candidate key you choose; it can never be NULL.
- With n attributes and one candidate key of k attributes: 2^{n−k} superkeys.
?? If A is the only candidate key of R(A, B, C, D), any set containing A is a superkey: A plus any subset of the other 3 columns → 2³ = 8 superkeys.
- Entity integrity: PK not NULL. Referential integrity: FK matches a PK or is NULL.
?? Entity integrity: every row must have a primary key value. Referential integrity: a foreign key must point to an existing row (or be NULL) — you cannot have a book whose author does not exist.

# Relational algebra
- Basic: σ (select rows), π (project columns, removes duplicates), ∪, −, × , ρ. Derived: ∩, ⋈, ÷.
?? Relational algebra is the maths behind SQL. σ (selection) picks rows like WHERE; π (projection) picks columns like SELECT; × combines every row of one table with every row of another; ⋈ (join) is a × followed by a filter on matching columns.
- Division R ÷ S: tuples in R associated with **all** tuples of S ("enrolled in all courses").
?? Division answers "for all" questions: students who took ALL the courses in the list. It keeps an R row only if it is paired with every row of S.
- |R × S| = |R|·|S|. Natural join with no common attributes = cross product.
?? Cartesian product pairs every row of R with every row of S, so 10 rows × 20 rows = 200 rows. A natural join matches on shared column names; if there are none, it degenerates into the cross product.
- select * from R, S ≡ R CROSS JOIN S.
?? Listing two tables with a comma and no WHERE in SQL creates every combination — exactly a CROSS JOIN (ISRO 2023 Q31).

# SQL essentials
- Logical evaluation: FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY.
?? SQL is written SELECT… FROM… WHERE…, but the database logically starts with FROM (which tables), filters rows with WHERE, groups, filters groups with HAVING, then picks columns with SELECT and finally sorts.
- WHERE filters rows, HAVING filters groups. Aggregates ignore NULL except COUNT(*). NULL = NULL is UNKNOWN; use IS NULL.
?? WHERE removes individual rows before grouping; HAVING removes whole groups after aggregation (e.g. departments with average salary > 5000). NULL means "unknown", so NULL = NULL is not true — use IS NULL.
- DDL: CREATE, ALTER, DROP, TRUNCATE. DML: SELECT, INSERT, UPDATE, DELETE. DCL: GRANT, REVOKE. TCL: COMMIT, ROLLBACK, SAVEPOINT.
?? SQL command families: DDL defines structure (CREATE/ALTER/DROP tables), DML works with data (SELECT/INSERT/UPDATE/DELETE), DCL controls permissions (GRANT/REVOKE), TCL controls transactions (COMMIT/ROLLBACK).
- IN / EXISTS subqueries; correlated subquery runs per outer row. BETWEEN is inclusive.
?? A subquery is a query inside another. A correlated subquery refers to the outer row, so it re-runs for each outer row. BETWEEN 1000 AND 2000 includes both 1000 and 2000.
- Views: virtual tables — restrict columns/rows for security; simple views are updatable; materialized views store results.
?? A view is a saved query that looks like a table. It can hide sensitive columns (show name but not salary) for security. A materialized view actually stores the result for speed.
- Composite index (a, b, c) helps predicates on a, (a, b), (a, b, c) — not on b or c alone.
?? A composite index sorted by (country, city, street) is like a phone book sorted by surname then first name: great for searching by country, or country + city, but useless for street alone (ISRO 2025 Q45).

# Functional dependencies & normalisation
- Armstrong: reflexivity, augmentation, transitivity (sound & complete). Derived: union, decomposition, pseudo-transitivity.
?? A functional dependency X → Y means: if two rows agree on X they agree on Y (roll number → name). Armstrong's three rules let you derive every dependency that follows from the given ones.
- Find keys with attribute closure: attributes never on any RHS must be in every key.
?? To find a key, compute the closure: start with some attributes and keep adding whatever the FDs let you derive. If you reach all attributes, it is a superkey. An attribute that never appears on the right side of any FD must be in every key.
| NF | Condition (for every non-trivial X → A) |
?? Normal forms remove redundancy step by step. 2NF: no column depends on just part of a composite key. 3NF: non-key columns depend only on the key (no chains). BCNF: every determinant is a key. Higher forms deal with multi-valued and join dependencies.
|---|---|
| 1NF | Atomic values |
| 2NF | No non-prime attribute partially depends on a candidate key |
| 3NF | X is a superkey **or** A is prime |
| BCNF | X is a superkey |
| 4NF | No non-trivial MVD unless X is superkey |
| 5NF | No join dependency not implied by keys |
- Any 2-attribute relation is in BCNF.
?? With only two columns, every non-trivial dependency has a key on the left, so the relation automatically satisfies BCNF.
- Lossless join: R1 ∩ R2 → R1 or R1 ∩ R2 → R2. Dependency preserving: (F1 ∪ F2)⁺ = F⁺.
?? Lossless decomposition: splitting a table and joining back gives exactly the original rows — guaranteed if the common columns form a key of one part. Dependency preserving: every original rule can still be checked inside a single part.
- 3NF synthesis: always lossless + dependency preserving. BCNF: always lossless, may lose dependencies.
?? 3NF can always be reached without losing data or rules. BCNF never loses data, but sometimes a dependency can no longer be checked inside one table — that is the trade-off.
> 2025 Q48: AB → CD, DE → P, C → E, P → C, B → G. Key AB. B → G is partial ⇒ not even 2NF.
?? Worked example: AB determines everything, so AB is the key. But B alone determines G — G depends on only part of the key. That partial dependency violates 2NF.

# Transactions
- ACID: Atomicity (all or nothing — undo log), Consistency, Isolation (concurrency control), Durability (committed changes survive any failure — redo log, WAL).
?? ACID makes transactions reliable. Atomicity: a money transfer either fully happens or not at all. Consistency: rules always hold. Isolation: concurrent transactions do not see each other's half-done work. Durability: once committed, it survives crashes — always (ISRO 2023 Q33).
- Conflicting operations: different transactions, same item, at least one write (RW, WR, WW).
?? Two operations conflict if swapping them could change the result: they are from different transactions, on the same data item, and at least one writes. Two reads never conflict.
- Conflict serializable ⇔ precedence graph acyclic. View serializable ⊇ conflict serializable (difference: blind writes).
?? Draw an arrow T1 → T2 whenever T1's operation conflicts with and comes before T2's. If there is no cycle, the schedule is equivalent to some serial order (conflict serializable).
- Recoverable: T commits only after every T it read from commits. Cascadeless: read only committed data. Strict: no read/write of uncommitted writes.
?? Recoverable: you never commit after reading data from a transaction that might still abort. Cascadeless: you only read committed data, so one abort cannot force others to abort. Strict: also no overwriting uncommitted data.
- 2PL (growing then shrinking) ⇒ conflict serializable, deadlock possible. Strict 2PL: hold X-locks till commit (no cascading aborts). Rigorous: hold all locks. Conservative: lock all at start (deadlock free).
?? Two-phase locking: a transaction first only acquires locks, then only releases them. This guarantees serializability, but deadlocks can still occur. Strict 2PL keeps write locks until commit to avoid cascading aborts.
- Timestamp ordering; Thomas write rule ignores obsolete writes. Wait-die (non-preemptive: older waits, younger dies), wound-wait (preemptive: older wounds younger).
?? Timestamp ordering uses start times instead of locks. Wait-die and wound-wait prevent deadlock using age: in wait-die an older transaction may wait but a younger one is killed; in wound-wait an older one kills (wounds) the younger one holding the lock.
- Isolation levels: read uncommitted (dirty reads) → read committed → repeatable read (phantoms) → serializable.
?? Isolation levels trade safety for speed. Read uncommitted can see others' unsaved changes (dirty reads). Read committed fixes that. Repeatable read also guarantees re-reading a row gives the same value. Serializable is fully safe.
- Recovery: WAL — log before data. Deferred update → redo only; immediate update → undo + redo. Checkpoints limit log scan.
?? Write-ahead logging: before changing data on disk, write the change to the log. After a crash, redo committed changes and undo uncommitted ones. Checkpoints mark a point so recovery need not scan the whole log.

# Indexing & storage
- Blocking factor bfr = ⌊block size / record size⌋; blocks = ⌈records / bfr⌉. Binary search ≈ ⌈log₂ blocks⌉ accesses.
?? Blocking factor = how many records fit in one disk block. E.g. 1024-byte blocks, 100-byte records → 10 per block; 30,000 records → 3000 blocks; binary search ≈ log₂ 3000 ≈ 12 block reads.
- Primary index: on ordering key, sparse (one entry per block). Clustering index on ordering non-key. Secondary: dense.
?? A primary index needs only one entry per block (sparse) because the file is sorted on that key. A secondary index on an unsorted column needs an entry for every record (dense).
- B+ tree order p: internal node ≤ p pointers; leaves linked for range scans.
?? A B+ tree index keeps keys sorted in a short wide tree; all data pointers sit in linked leaves, so range queries just walk along the leaves.

# NoSQL
- Flexible schema, horizontal scaling, BASE (Basically Available, Soft state, Eventually consistent).
?? NoSQL databases drop the rigid table schema and scale out across many machines. BASE means they stay available and become consistent eventually, rather than instantly.
- Key-value (Redis, DynamoDB), document (MongoDB, BSON), wide-column (Cassandra, HBase), graph (Neo4j).
?? NoSQL families with examples: key-value (a giant dictionary), document (JSON-like records), wide-column (rows with flexible columns, very distributed), graph (nodes and edges, for relationships).
- CAP: choose two of Consistency, Availability, Partition tolerance (P is mandatory in practice → CP or AP).
?? CAP theorem: when the network splits (partition), a distributed database must choose between staying consistent (refuse some requests) and staying available (answer, maybe with stale data).
`);

ISRO.addNotes('coa', 'Computer Organization & Architecture', `
# Performance
- CPU time = IC × CPI × T_clock = IC × CPI / f. MIPS = f / (CPI × 10⁶).
?? Execution time = number of instructions × average clock cycles per instruction × length of one cycle. E.g. 10⁹ instructions × CPI 2 on a 2 GHz CPU (0.5 ns cycle) = 1 second. MIPS = millions of instructions per second.
- Amdahl's law: Speedup = 1 / ((1 − p) + p/s). Upper bound 1/(1 − p).
?? Amdahl's law: speeding up only part of a program has limited benefit. If 80% can run 4× faster, total speedup = 1 / (0.2 + 0.8/4) = 2.5. Even with infinite speed on that 80%, the 20% caps you at 5×.

# Instruction set architecture
| Mode | Operand | Memory refs (operand) |
?? Addressing modes = where the instruction finds its operand. Immediate: the value is inside the instruction (ADD #5). Direct: the instruction holds the memory address. Indirect: the instruction points to a place that holds the address (two memory trips). The last column counts memory reads needed to get the operand.
|---|---|---|
| Immediate | In instruction | 0 |
| Register | In register | 0 |
| Direct (absolute) | M[A] | 1 |
| Indirect | M[M[A]] | 2 |
| Register indirect | M[R] | 1 |
| Indexed / base + displacement | M[R + d] | 1 |
| PC-relative | Target = PC + d | (branches, relocatable) |
| Auto-increment | M[R], then R++ | arrays |
- Instruction format bit budget: total = opcode + operand fields (register field = log₂ #registers).
?? An instruction is a fixed number of bits split into fields. With 32 registers each register field needs 5 bits (2⁵ = 32). E.g. 32-bit instruction, 8-bit opcode, two registers → 32 − 8 − 10 = 14 bits left for an immediate value.
- Zero-address = stack machine; one-address = accumulator.
?? A stack machine needs no operand addresses (ADD takes the top two stack items) → zero-address. An accumulator machine always uses one built-in register, so instructions name just one operand.
- RISC: fixed-length instructions, load/store, many registers, hardwired control, pipelining-friendly. CISC: variable length, many modes, microprogrammed.
?? RISC = small set of simple, same-length instructions; only load/store touch memory; easy to pipeline (ARM, RISC-V). CISC = many complex instructions of varying length that can work on memory directly (x86).

# Control unit
- Hardwired: fast, hard to modify. Microprogrammed: control memory; horizontal (one bit per signal, wide, parallel) vs vertical (encoded, narrow, needs decoders).
?? The control unit generates signals that drive the CPU. Hardwired = fixed logic circuits (fast). Microprogrammed = signals stored as "microcode" in a small memory (easier to change). Horizontal microcode has one bit per signal (wide words); vertical encodes them (narrow, needs decoding).
- Micro-operation = elementary operation on register data in one clock (e.g. R1 ← R1 + R2).
?? A micro-operation is the smallest step the CPU does in one clock, like copying a register or adding two registers. A machine instruction is made of several micro-operations.

# Pipelining
- k stages, n instructions: (k + n − 1) cycles. Speedup = nk / (k + n − 1) → k.
?? Pipelining is like an assembly line: while one instruction is being executed, the next is being decoded and the one after is being fetched. The first instruction needs k cycles to get through; after that one finishes every cycle → k + n − 1 cycles total.
- Clock = max(stage delay) + latch delay. Non-pipelined time = sum of stage delays.
?? All stages move together, so the clock must wait for the slowest stage, plus the delay of the latch (register) between stages. E.g. stages 150, 120, 160, 140 ps + 5 ps latch → clock 165 ps.
- Hazards: structural (resource conflict), data (RAW true; WAR/WAW false — removed by renaming), control (branches).
?? Hazards stop the next instruction from going on time. Structural: two instructions need the same hardware. Data: an instruction needs a result not yet produced (read-after-write). Control: after a branch we do not yet know which instruction comes next.
- Fixes: forwarding/bypassing, stalls (load-use needs 1), branch prediction, delayed branch, flushing.
?? Forwarding sends a result straight from the ALU to the next instruction without waiting for it to be written back. A load's value comes too late even for that, so one bubble (stall) is needed. Branch prediction guesses the branch outcome to keep going.
- CPI with stalls = 1 + (branch freq × penalty) + ...
?? Each stall adds cycles. If 20% of instructions are branches that each cost 2 extra cycles, average CPI = 1 + 0.2 × 2 = 1.4.
- Instruction queue/prefetch buffer is FIFO. Superscalar = multiple issue per cycle (CPI < 1). VLIW = compiler packs parallel ops. Tomasulo = dynamic out-of-order scheduling.
?? Superscalar CPUs issue several instructions per cycle using multiple units. VLIW leaves the parallel scheduling to the compiler. Tomasulo's algorithm lets instructions execute out of order as soon as their inputs are ready.

# Memory hierarchy
- Address split: **Tag | Index | Offset**. Offset = log₂(block size). Index = log₂(#lines) for direct-mapped, log₂(#sets) for set-associative, 0 for fully associative.
?? A cache uses the memory address in three parts. The offset picks the byte inside a block; the index picks which cache line (or set) to look in; the tag is stored to check it is the right block. E.g. 64 KB direct-mapped with 64-byte blocks, 32-bit address → offset 6, index 10, tag 16.
- Direct-mapped: block j → line j mod m. k-way: #sets = #lines / k.
?? Direct-mapped: each memory block can go to exactly one cache line (block number mod lines) — simple but conflicts. k-way set-associative: each block can go into any of k lines in its set — fewer conflicts.
- AMAT = hit time + miss rate × miss penalty. Two-level: L1 hit + m1 × (L2 hit + m2 × memory).
?? Average memory access time: every access pays the hit time; misses additionally pay the penalty. E.g. 1 ns + 5% × 100 ns = 6 ns. With two cache levels, an L1 miss goes to L2, and only L2 misses go to main memory.
- Misses: compulsory, capacity, conflict (eliminated by full associativity), coherence.
?? Why misses happen: compulsory (first ever access), capacity (cache too small), conflict (two blocks fight over the same line — goes away with full associativity), coherence (another core changed the data).
- Write-through (+ write buffer) vs write-back (dirty bit). Write-allocate vs no-write-allocate.
?? On a write: write-through updates cache and memory every time (simple, more traffic). Write-back only updates the cache and marks it dirty; memory is updated when the block is evicted.
- Replacement: LRU, FIFO, random.
?? When a set is full, which block is evicted: least recently used (LRU), oldest (FIFO) or random.
- SRAM: flip-flops, fast, cache. DRAM: capacitor, refresh, dense, main memory.
?? SRAM stores each bit in a flip-flop — fast, expensive, used for caches. DRAM stores each bit as charge in a capacitor that leaks, so it must be refreshed — slower but dense and cheap, used for main RAM.
- Chips needed = (total words / chip words) × (word width / chip width). 4 GB byte-addressable → 32 address lines.
?? To build a big memory from small chips, multiply how many chips you need for depth (words) by how many for width (bits). E.g. 16K × 8 from 1K × 4 chips: 16 × 2 = 32 chips. 2³² bytes = 4 GB needs 32 address lines.
- Interleaving: consecutive words in different modules → higher bandwidth.
?? Interleaving spreads consecutive addresses across several memory banks so they can be accessed in parallel — higher bandwidth.

# Computer arithmetic
- n-bit 2's complement: −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1. Overflow: carry into MSB ≠ carry out of MSB.
?? Two's complement is how computers store negative numbers. 8 bits cover −128 … +127. Overflow happens when adding two positives gives a negative (or two negatives give a positive).
- 2's complement of x = invert + 1 (or copy up to and including first 1 from right, invert the rest).
?? To negate a number in two's complement: flip every bit and add 1. E.g. 35 = 00100011 → 11011100 → 11011101 = −35.
- Booth's algorithm: pairs (Qᵢ, Qᵢ₋₁): 10 → subtract, 01 → add, 00/11 → shift. Efficient for runs of 1s.
?? Booth's algorithm multiplies signed numbers efficiently: a run of 1s like 0111 is treated as 1000 − 0001, so long runs of 1s need just one subtraction and one addition instead of many additions.
- **IEEE 754** single: 1 sign | 8 exponent (bias 127) | 23 fraction; value = (−1)ˢ × 1.f × 2^{e−127}. Double: 1 | 11 (bias 1023) | 52.
?? IEEE 754 stores real numbers like scientific notation in binary: a sign bit, an exponent (stored with 127 added so it is never negative), and the fraction after an implied leading 1. Value = ± 1.fraction × 2^{exponent − 127}.
- Exponent all 0s: zero/denormal; all 1s: ∞ (f = 0) or NaN (f ≠ 0). 1.0 = 0x3F800000.
?? Special patterns: exponent all zeros means zero or a very tiny "denormal"; all ones means infinity (fraction 0) or NaN "not a number" (fraction non-zero). 1.0 is 0x3F800000 — worth remembering.

# I/O and interrupts
- Programmed I/O (polling, wastes CPU), interrupt-driven, DMA (block transfer without CPU; cycle stealing vs burst).
?? Three ways to do I/O. Programmed: CPU keeps asking "ready?" (wasteful). Interrupt-driven: the device signals when ready. DMA: a controller copies data to memory by itself; it either borrows the bus one word at a time (cycle stealing) or takes it for the whole block (burst).
- Vectored interrupt: the device supplies the ISR address/vector. Daisy chaining: serial priority, nearest device highest.
?? Vectored interrupt: the device tells the CPU directly which handler to run. Daisy chaining connects devices in a line; the one electrically closest to the CPU gets priority.
- Memory-mapped I/O (normal load/store) vs isolated I/O (IN/OUT, separate space).
?? Memory-mapped I/O: device registers look like normal memory addresses, so ordinary load/store instructions talk to devices. Isolated I/O: devices have a separate address space reached with special IN/OUT instructions.
- Endianness: little-endian stores LSB at lowest address (x86); big-endian = network order.
?? Endianness = byte order of multi-byte numbers. Little-endian (x86) stores the smallest byte first: 0x12345678 is stored as 78 56 34 12. Big-endian stores 12 34 56 78 and is used on networks.

# Parallel architecture
- Flynn: SISD (uniprocessor), SIMD (vector/GPU), MISD (rare), MIMD (multicore, clusters).
?? Flynn's classification by instruction and data streams: SISD = ordinary single-core CPU; SIMD = one instruction on many data at once (GPU, vector units); MIMD = many independent cores.
- Cache coherence: MESI (Modified, Exclusive, Shared, Invalid); snooping for buses, directories for many cores.
?? With several cores each having its own cache, copies of the same data can get out of sync. Coherence protocols like MESI track whether each cached line is Modified, Exclusive, Shared or Invalid to keep them consistent.
`);

ISRO.addNotes('dl', 'Digital Logic', `
# Number systems & codes
- Binary ↔ octal (groups of 3) ↔ hex (groups of 4). Fraction to binary: repeatedly ×2.
?? One octal digit = exactly 3 bits and one hex digit = exactly 4 bits, so you can convert by grouping. E.g. 1010 0011 = A3 in hex. For fractions, multiply by 2 repeatedly and take the integer parts as bits.
- (0.11101)₂ = 0.5 + 0.25 + 0.125 + 0.03125 = 0.90625.
?? After the binary point the place values are ½, ¼, ⅛, 1/16, 1/32… Add those where the bit is 1: 0.11101 = 0.5 + 0.25 + 0.125 + 0.03125 = 0.90625 (ISRO 2025 Q49).
- Signed: sign-magnitude & 1's complement have two zeros; 2's complement has one zero and range −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1.
?? Ways to store negative numbers. Sign-magnitude and 1's complement end up with both +0 and −0. 2's complement has a single zero and makes addition hardware simple, so every computer uses it.
- BCD: each decimal digit in 4 bits. Excess-3 = BCD + 3 (self-complementing). Gray: gᵢ = bᵢ ⊕ bᵢ₊₁; adjacent values differ in one bit.
?? BCD stores each decimal digit separately in 4 bits (59 → 0101 1001). Excess-3 adds 3 to each digit. Gray code changes only one bit between consecutive numbers — used in rotary encoders to avoid glitches.

# Boolean algebra
- Absorption: A + AB = A; A(A + B) = A. Redundancy: A + A′B = A + B. Consensus: AB + A′C + BC = AB + A′C.
?? Simplification rules: if A is already true, AB adds nothing → A + AB = A. A + A′B = A + B (if A is false, B must decide). The consensus term BC in AB + A′C + BC is redundant and can be removed.
- De Morgan: (AB)′ = A′ + B′; (A + B)′ = A′B′. Duality: swap +/·, 0/1.
?? De Morgan's laws: NOT(A AND B) = (NOT A) OR (NOT B); NOT(A OR B) = (NOT A) AND (NOT B). "Break the bar, change the sign." Duality: swap AND/OR and 0/1 to get a matching identity.
- XOR: A ⊕ B = A′B + AB′; A ⊕ A = 0; A ⊕ 1 = A′; XNOR = equivalence.
?? XOR outputs 1 when the inputs are different. Anything XOR itself is 0; XOR with 1 flips it. XNOR outputs 1 when the inputs are equal — a 1-bit "are they equal?" check.
- NAND/NOR are universal. Gate counts with 2-input NAND: NOT 1, AND 2, OR 3, XOR 4, XNOR 5. With NOR: NOT 1, OR 2, AND 3, XNOR 4, XOR 5.
?? NAND alone (or NOR alone) can build any circuit — they are "universal". Remember the minimum gate counts: e.g. an XOR needs 4 two-input NANDs.
- NAND/NOR with inputs tied = NOT. NAND of inverted inputs = OR.
?? A NAND or NOR gate with both inputs joined gives NOT A. Inverting both inputs first and then NANDing gives (A′B′)′ = A + B, an OR gate (ISRO 2023 Q38).
- n variables: 2ⁿ minterms, 2^{2ⁿ} functions.
?? With n inputs there are 2ⁿ input combinations (minterms / truth-table rows). Each row can output 0 or 1 → 2^{2ⁿ} possible Boolean functions.

# K-maps
- Groups of 1, 2, 4, 8 … cells (wrap-around). Group of 2ᵏ eliminates k variables.
?? A K-map is a truth table laid out so neighbouring cells differ in one variable. Circle groups of 1s of size 1, 2, 4, 8 (edges wrap around). In a group of 4 = 2² cells, two variables change and disappear from the term.
- Prime implicant: largest possible group. Essential: covers a minterm nothing else covers.
?? A prime implicant is a group that cannot be made any bigger. An essential one is the only group covering some 1 — it must appear in the final answer.
- Don't cares (X) may be treated as 1 or 0 to enlarge groups.
?? Don't-care cells are input combinations that never happen, so you may treat them as 1 when that makes a bigger group, or ignore them.
- Static-1 hazard: add the consensus term.
?? A hazard is a brief wrong output glitch when an input changes, because two paths have different delays. Adding the redundant consensus term covers the gap.

# Combinational circuits
- Half adder: S = A ⊕ B, C = AB. Full adder: S = A ⊕ B ⊕ Cᵢₙ, Cₒᵤₜ = AB + Cᵢₙ(A ⊕ B); 3 inputs, 2 outputs; FA = 2 HA + OR.
?? A half adder adds two bits: sum = XOR, carry = AND. A full adder also adds an incoming carry (3 inputs → sum and carry-out). Chain full adders to add multi-bit numbers.
- Ripple carry delay ∝ n. Carry look-ahead: Gᵢ = AᵢBᵢ, Pᵢ = Aᵢ ⊕ Bᵢ, Cᵢ₊₁ = Gᵢ + PᵢCᵢ.
?? In a ripple-carry adder each stage waits for the previous carry, so delay grows with the number of bits. Carry look-ahead computes all carries at once from "generate" (both bits 1) and "propagate" (one bit 1) signals — much faster.
- MUX 2ⁿ:1 has n select lines; can implement any function of n + 1 variables. 16:1 from 4:1 needs 5.
?? A multiplexer (MUX) is a selector switch: n select lines choose one of 2ⁿ inputs. Connecting the right constants/variables to its inputs lets it implement any function. To build 16:1 from 4:1 MUXes: four in the first level + one to choose among them = 5.
- DEMUX 1:2ⁿ has n select lines (1-16 demux → 4).
?? A demultiplexer does the reverse: one input routed to one of 2ⁿ outputs, chosen by n select lines. 16 outputs → 4 select lines.
- Decoder n → 2ⁿ (+ OR gates = any function). 1-of-32 from 3:8 decoders → 4 (+ a 2:4 for enables).
?? A decoder turns an n-bit number into one active line out of 2ⁿ (3 → 8). OR-ing selected outputs implements any function. A 1-of-32 decoder from 3-to-8 decoders needs 32/8 = 4 of them.
- Encoder 2ⁿ → n (octal-to-binary uses 3 OR gates); priority encoder resolves multiple inputs.
?? An encoder does the reverse: 2ⁿ input lines → n-bit code. A priority encoder outputs the code of the highest-priority active input if several are on.
- Comparator: (A > B) = AB′, (A = B) = (A ⊕ B)′.
?? Comparing two bits: A > B only when A = 1 and B = 0 → AB′. They are equal when XNOR is 1.

# Sequential circuits
| FF | Characteristic equation | Notes |
?? Flip-flops store one bit. SR: set/reset (both 1 is forbidden). JK: like SR but J = K = 1 toggles. D: output copies D at the clock. T: toggles when T = 1. The equations give the next state Q⁺ from inputs and current state Q.
|---|---|---|
| SR | Q⁺ = S + R′Q (SR = 0) | S = R = 1 invalid |
| JK | Q⁺ = JQ′ + K′Q | J = K = 1 toggles |
| D | Q⁺ = D | Delay / latch |
| T | Q⁺ = T ⊕ Q | Toggle |
- Gated D latch: transparent while enable/clock HIGH, holds when LOW. Edge-triggered FF samples on the edge.
?? A latch is level-sensitive: while enable is high, output follows input (transparent); when low, it holds. A flip-flop is edge-triggered: it captures the input only at the clock edge (ISRO 2025 Q54).
- Race-around: level-triggered JK with J = K = 1 and long pulse → fix with master-slave or edge triggering.
?? Race-around: in a level-triggered JK with J = K = 1, the output keeps toggling as long as the clock is high, ending in an unpredictable state. Master-slave or edge-triggered designs toggle exactly once per clock.
- Counters: MOD-N needs ⌈log₂ N⌉ flip-flops. Ripple (asynchronous): f_max = 1/(n·t_pd); each stage divides frequency by 2. Synchronous: all FFs share clock.
?? A MOD-N counter cycles through N states, needing enough flip-flops to hold N (log₂ N rounded up; MOD-10 → 4). In a ripple counter each flip-flop clocks the next, so delays add up and each stage halves the frequency.
- Ring counter: n FFs → n states. Johnson counter: 2n states.
?? A ring counter passes a single 1 around n flip-flops → n states. A Johnson counter feeds back the inverted output → 2n states (4 flip-flops → MOD-8).
- Shift registers: SISO, SIPO, PISO, PIPO. n-bit serial delay = n × clock period (8 bits at 400 MHz → 20 ns).
?? Shift registers move bits one position per clock. Names say how data goes in/out: Serial or Parallel. Passing a bit through an 8-bit serial register takes 8 clocks: 8 × 2.5 ns = 20 ns at 400 MHz.
- Mealy (output = f(state, input)) usually needs fewer states than Moore (output = f(state)).
?? State machines: a Moore machine's output depends only on its current state; a Mealy machine's output also depends on the current input, so it often needs fewer states and reacts one step sooner.

# Logic families
- CMOS: lowest static power, high noise margin. TTL: classic, fan-out ~10. ECL: fastest (non-saturating), most power.
?? Logic families are chip technologies. CMOS uses almost no power when idle — used everywhere today. ECL is the fastest but power-hungry. TTL is the older standard.
- Fan-in = number of inputs; fan-out = number of gate inputs one output can drive; propagation delay; noise margin.
?? Fan-in = how many inputs a gate has. Fan-out = how many other gate inputs one output can drive safely. Propagation delay = time for an input change to reach the output.
`);

ISRO.addNotes('prog', 'Programming & OOP', `
# C essentials
- sizeof(char) = 1 always. Typical 64-bit: int 4, long 8, pointer 8, float 4, double 8.
?? sizeof gives the size in bytes. char is always 1 byte by definition; others depend on the machine — on a typical 64-bit PC int is 4 and any pointer is 8.
- Struct padding aligns members (struct {char; int;} = 8). Union size = largest member (+ padding).
?? Compilers insert padding so each member sits at an address that is a multiple of its size: struct {char c; int i;} gets 3 padding bytes after c → 8 bytes. A union stores all members in the same memory, so its size is that of the largest member.
- sizeof("ISRO") = 5 (includes \\0); strlen = 4.
?? C strings end with a hidden \\0 character. sizeof("ISRO") counts it (5); strlen counts only visible characters (4).
- Integer division truncates toward zero (C99): −7/3 = −2, −7 % 3 = −1. % sign follows the dividend.
?? Integer division drops the fraction toward zero: −7 / 3 = −2 (not −3). The remainder keeps the sign of the left number: −7 % 3 = −1.
- Modifying a variable twice without a sequence point (i++ + ++i, a[i] = i++) is **undefined behaviour**.
?? Undefined behaviour means the C standard gives no answer — different compilers may print different things. Changing the same variable twice in one expression (i++ + ++i) is the classic example.
- Short circuit: in A && B, B is not evaluated if A is false; in A || B, B is skipped if A is true.
?? In A && B, if A is false the whole thing is false, so B is never evaluated (and any ++ inside it never happens). In A || B, if A is true B is skipped.
- if (a = 5) is assignment (always true). switch cases fall through until break.
?? if (a = 5) assigns 5 to a and then tests 5, which is true — a common bug (meant ==). In a switch, after a matching case, execution falls into the following cases until it hits break.
- for (…); with a stray semicolon has an empty body.
?? for (i = 0; i < 5; i++); has a semicolon as its body, so the loop just counts to 5 and the next statement runs once afterwards.

# Pointers
- p + k advances by k × sizeof(*p): int* (2-byte) 200 + 3 → 206.
?? Adding k to a pointer moves it k elements, not k bytes: an int pointer at address 200 with 2-byte ints → p + 3 = 200 + 3 × 2 = 206 (ISRO 2023 Q27).
- int *p[10] → array of 10 pointers; int (*p)[10] → pointer to array; int (*f)(int) → pointer to function; int *f(int) → function returning int*.
?? Reading C declarations: start at the name and go right then left; brackets change priority. int *p[10] = array of 10 int pointers. int (*p)[10] = one pointer to an array of 10 ints. int (*f)(int) = pointer to a function.
- *(a + i) ≡ a[i] ≡ i[a]. Arrays decay to pointers when passed to functions.
?? An array name acts like a pointer to its first element, so a[i] is really *(a + i). When passed to a function only that pointer is passed — the function does not know the array's size.
- NULL dereference, out-of-bounds access, use-after-free, double free → undefined behaviour. Leak = allocated memory lost without free.
?? All these are bugs with unpredictable results: using a NULL pointer, writing past an array's end, using memory after free, freeing twice. A leak is memory you allocated but lost track of, so it is never freed.
- Dangling pointer: points to freed/expired memory. Wild pointer: never initialised.
?? A dangling pointer still holds the address of memory that was freed (or a local variable whose function returned). A wild pointer was never given any valid address.
- malloc (uninitialised), calloc(n, size) (zeroed), realloc, free.
?? malloc gives raw memory with garbage contents; calloc(n, size) gives n × size bytes set to zero; realloc resizes; free returns it.

# Storage classes & keywords
| Class | Scope | Lifetime | Default |
?? Storage classes decide where a variable lives and how long. auto (normal locals) die when the block ends and start with garbage. static locals keep their value between calls and start at 0. extern refers to a global defined in another file.
|---|---|---|---|
| auto | Block | Block | Garbage |
| register | Block | Block | Garbage (no &) |
| static (local) | Block | Program | 0 |
| static (global) | File | Program | 0 |
| extern | Global | Program | 0 |
- const: read-only. volatile: value may change outside program flow (hardware registers, ISR flags) — compiler must re-read every time. Crucial for on-board embedded code.
?? const promises not to change a value. volatile tells the compiler "this can change behind your back" (a hardware register, a flag set by an interrupt), so it must re-read it every time instead of caching it — essential in satellite on-board software.
- Macros are textual: #define SQ(x) x*x → SQ(2+3) = 11. Use ((x)*(x)).
?? A macro is pure text replacement before compiling. SQ(2+3) becomes 2+3*2+3 = 11, not 25. Wrap every parameter and the whole macro in brackets: ((x)*(x)).

# Bit tricks
- x & (x − 1) clears lowest set bit; = 0 iff x is a power of 2.
?? x − 1 flips the lowest 1-bit and everything below it, so x & (x − 1) removes that lowest 1. A power of two has a single 1-bit, so the result becomes 0 — a classic power-of-two test.
- x & −x isolates the lowest set bit. x << k = x·2ᵏ; x >> k = x/2ᵏ (unsigned).
?? x & −x keeps only the lowest 1-bit. Shifting left by k multiplies by 2ᵏ; shifting right divides by 2ᵏ for unsigned numbers.
- Swap without temp: a ^= b; b ^= a; a ^= b.
?? XOR swap: because a ^ b ^ b = a, three XORs swap two variables without a temporary (fails if both refer to the same variable).

# Recursion tracing
- Write the call tree; count calls. f(n) = n % 10 + f(n/10) sums digits; f(n) = n·f(n−1) factorial; fib recursive calls = 2F(n+1) − 1.
?? For recursion questions draw the tree of calls with their arguments and return values. Recognise common shapes: n % 10 + f(n / 10) adds digits; n × f(n − 1) is factorial.

# OOP (C++ / Java)
- Encapsulation, abstraction, inheritance, polymorphism.
?? The four pillars of OOP. Encapsulation: bundle data with methods and hide details. Abstraction: show only what matters. Inheritance: a class reuses another's features. Polymorphism: one interface, many forms.
- Compile-time polymorphism: function/operator overloading, templates. Run-time: virtual functions (vtable + vptr).
?? Compile-time polymorphism: the compiler picks among same-named functions by their parameters (overloading). Run-time: a virtual function call is decided while running by the object's actual type, using a table of function pointers (vtable).
- Pure virtual (= 0) ⇒ abstract class. Make base destructors virtual.
?? A pure virtual function (virtual void f() = 0;) has no body, so the class is abstract and cannot be created directly — only subclasses that implement f can. Base class destructors should be virtual so deleting through a base pointer cleans up properly.
- C++ class default private; struct default public. friend functions access private members.
?? In C++, members of a class are private unless stated; in a struct they are public. A friend function is allowed to access a class's private members even though it is not a member.
- Copy constructor: pass/return by value, initialise from another object. Shallow vs deep copy.
?? The copy constructor builds a new object from an existing one — called when passing or returning by value. A shallow copy copies pointers (both objects share data); a deep copy duplicates the data.
- Diamond problem → virtual inheritance (C++); Java allows multiple inheritance only through interfaces.
?? Diamond problem: if B and C both inherit A, and D inherits B and C, D gets two copies of A. C++ fixes it with virtual inheritance; Java avoids it by letting a class extend only one class (but implement many interfaces).
- Java: final (no override / no extend / constant), static, abstract, interface; objects on heap, GC; Strings immutable; checked exceptions must be caught or declared.
?? Java keywords: final = cannot change (variable), cannot override (method), cannot extend (class). Objects live on the heap and are freed by the garbage collector. Strings never change once created. Checked exceptions must be handled or declared with throws.
- JVM: bytecode is platform independent; JIT compiles hot code.
?? Java compiles to bytecode, which any JVM on any OS can run (write once, run anywhere). The JVM's JIT compiler turns frequently used bytecode into fast native code.

# Python quick hits
- / gives float, // floor division, ** power. Lists mutable, tuples/strings immutable. [1,2]*2 = [1,2,1,2].
?? Python quick facts: 3 / 2 = 1.5 (always float), 3 // 2 = 1. Lists can be changed; tuples and strings cannot. Multiplying a list repeats it.

# Language concepts
- Parameter passing: value, reference, value-result, name. C is call-by-value (pointers simulate reference).
?? Call by value: the function gets a copy, so changes do not affect the caller. Call by reference: it gets the original, so changes do. C only has call by value, but passing a pointer lets the function change the original.
- Static (lexical) scoping: C, C++, Java, Python. Dynamic scoping: early Lisp, bash variables.
?? Static scoping: a variable refers to the definition visible in the code where the function was written. Dynamic scoping: to the most recent definition active at run time in the call chain.
`);

ISRO.addNotes('se', 'Software Engineering', `
# Process models
| Model | Use when | Key idea |
?? Software process models are recipes for organising a project. Waterfall does each phase once in order (good when requirements will not change). Prototyping builds a quick mock-up to discover what users want. Spiral repeats cycles, each starting with risk analysis. Agile delivers small working pieces every few weeks.
|---|---|---|
| Waterfall | Requirements stable | Sequential phases |
| V-model | Safety-critical | Each dev phase has a test phase |
| Prototyping | Requirements unclear | Throwaway/evolutionary prototype |
| Incremental / iterative | Early partial delivery | Build in increments |
| Spiral (Boehm) | Large, risky projects | Risk analysis in every loop |
| RAD | Tight time, modular | Component reuse |
| Agile / Scrum | Changing requirements | Sprints, backlog, daily stand-up |
- V-model pairs: requirements ↔ acceptance test; system design ↔ system test; architecture ↔ integration test; module design ↔ unit test.
?? The V-model draws development going down the left side and testing coming up the right. Each design level is checked by a matching test level: individual modules by unit tests, how they fit together by integration tests, the whole system by system tests, and the original requirements by acceptance tests.
- CMM levels: 1 Initial, 2 Repeatable, 3 Defined, 4 Managed, 5 Optimizing.
?? CMM rates how mature an organisation's process is, from chaotic (Initial) to continuously improving (Optimizing). Order: Initial, Repeatable, Defined, Managed, Optimizing — asked in ISRO 2025.

# Requirements
- SRS (IEEE 830): correct, unambiguous, complete, consistent, ranked, verifiable, modifiable, traceable.
?? The SRS (Software Requirements Specification) is the document of what the software must do. A good one is clear (one meaning only), complete, consistent (no contradictions) and testable. "Ambiguous" is never a desired property.
- Functional (what) vs non-functional (performance, reliability, safety, security, usability).
?? Functional requirements say what the system does ("compute the orbit"). Non-functional ones say how well ("respond within 2 seconds", "99.9% uptime", "secure").

# Estimation
- LOC, Function Points: UFP = Σ count × weight over EI, EO, EQ, ILF, EIF. FP = UFP × (0.65 + 0.01 × ΣFᵢ) with 14 factors rated 0–5.
?? Function points measure software size by what it offers users — inputs, outputs, queries, internal files, external interfaces — each weighted by complexity. The 14 adjustment factors (rated 0–5) scale the total between 0.65 and 1.35.
> 2025: UFP 578, all factors 3 → CAF = 0.65 + 0.42 = 1.07 → FP = 618.46.
?? Worked example from ISRO 2025: 14 factors × 3 = 42, so the adjustment = 0.65 + 0.42 = 1.07. 578 × 1.07 = 618.46.
- Basic COCOMO: Effort = a·KLOC^{b}, Time = c·Effort^{d}.
?? COCOMO estimates effort (person-months) from size in thousands of lines of code. The exponent b > 1 means bigger projects need disproportionately more effort.
| Mode | a | b | c | d |
?? COCOMO constants for the three project types. Organic = small team, familiar problem. Embedded = tight hardware/real-time constraints (like flight software) — highest exponent, so most effort.
|---|---|---|---|---|
| Organic | 2.4 | 1.05 | 2.5 | 0.38 |
| Semi-detached | 3.0 | 1.12 | 2.5 | 0.35 |
| Embedded | 3.6 | 1.20 | 2.5 | 0.32 |
- PERT: expected time = (o + 4m + p)/6, σ = (p − o)/6. CPM: critical path = longest path, zero slack.
?? PERT estimates task time from optimistic, most likely and pessimistic guesses: (o + 4m + p)/6. The critical path is the longest chain of dependent tasks — it fixes the earliest finish date; any delay on it delays the project.
- Risk management: identification → analysis → planning → monitoring.
?? Risk management order: first list what could go wrong (identify), judge likelihood and impact (analyse), prepare responses (plan), then keep watching (monitor).

# Design
- Aim for **low coupling, high cohesion**.
?? Coupling = how dependent modules are on each other (want low, so changes do not ripple). Cohesion = how focused a module is on one job (want high).
- Cohesion (worst → best): coincidental, logical, temporal, procedural, communicational, sequential, functional.
?? Cohesion from worst to best. Coincidental = random unrelated stuff in one module. Functional = everything in the module contributes to exactly one task — the ideal.
- Coupling (best → worst): data, stamp, control, external, common, content.
?? Coupling from best to worst. Data coupling = modules pass only simple data parameters (ideal). Content coupling = one module reaches into another's internals (worst).
- Fan-in = callers of X (high fan-in ⇒ tightly coupled, changes ripple). Fan-out = functions X calls (high ⇒ X complex).
?? Fan-in = how many functions call X — high fan-in means many places depend on X, so changing it has wide effects. Fan-out = how many functions X calls — high fan-out suggests X is complex. All four statements were true in ISRO 2025 Q75.
- Cyclomatic complexity V(G) = E − N + 2P = (decision points) + 1 = number of regions (planar CFG). It bounds the number of basis-path test cases — white-box.
?? Cyclomatic complexity counts independent paths through code: edges − nodes + 2 in the control-flow graph, or simply number of decisions (if/while/for/case) + 1. It tells the minimum number of test cases to cover all basic paths.
- Halstead: n₁, n₂ distinct operators/operands; N₁, N₂ totals; volume V = N log₂ n.
?? Halstead metrics measure a program by counting its operators (+, =, if…) and operands (variables, constants). Volume grows with program length and vocabulary.
- Modelling: DFD (functional; level 0 = context diagram), ER (static data), state charts (dynamic), structure chart, HIPO (Hierarchy + Input-Process-Output).
?? Different diagrams show different views: DFD shows how data flows between processes (level 0 = the whole system as one bubble); ER shows data structure; state charts show behaviour over time; HIPO shows a hierarchy of modules with their inputs, processing and outputs.
- UML: structural — class, object, component, deployment, package; behavioural — use case, activity, state machine, sequence, communication, timing. Composition = filled diamond, aggregation = hollow diamond, inheritance = hollow triangle.
?? UML is the standard diagram language for software. Structural diagrams show what exists (classes, components); behavioural ones show what happens (use cases, sequence of messages over time). A filled diamond = strong ownership (composition).
- Patterns: Singleton, Factory, Observer, Adapter, Decorator, MVC.
?? Design patterns are reusable solutions. Singleton: only one instance (e.g. one configuration manager). Observer: subscribers are notified when something changes. Adapter: makes one interface fit another. MVC: separates data, display and control.

# Testing
- Verification: building the product right (reviews, inspections). Validation: building the right product (testing against user needs).
?? Verification asks "did we build it right?" — checking against the specification (reviews, inspections). Validation asks "did we build the right thing?" — checking it actually meets the user's needs.
- Levels: unit → integration (top-down uses stubs; bottom-up uses drivers; big-bang; sandwich) → system → acceptance (alpha at developer site, beta at user site).
?? Testing levels from small to big. Integration testing joins modules; if a module below is not ready, a fake "stub" stands in; if the caller above is missing, a "driver" calls the module. Alpha testing: real users at the developer's site; beta: at their own site.
- Black box: equivalence partitioning, boundary value analysis (min−1, min, min+1, max−1, max, max+1), decision tables, cause-effect graphs, state transitions.
?? Black-box testing uses only the specification, not the code. Equivalence partitioning: one test per group of similar inputs. Boundary value analysis: test right at and around the edges (for 1–100: 0, 1, 2, 99, 100, 101) because bugs cluster at boundaries.
- White box coverage (weak → strong): statement < branch/decision < condition < condition/decision < **MC/DC** < multiple-condition. MC/DC = Modified Condition/Decision Coverage, required by DO-178C Level A avionics software.
?? White-box coverage levels, weakest first. Statement: every line runs once. Branch: every if goes both ways. MC/DC: each condition is shown to independently change the decision — required for avionics and space software.
- Regression testing: re-test after changes. Smoke: build verification. Sanity: narrow check after a fix. Stress: beyond limits. Load: expected peak. Mutation: seed faults to grade the test suite.
?? Regression testing re-runs old tests after a change to make sure nothing broke. Smoke test = quick check a new build basically works. Stress test = push beyond limits to see how it fails. Mutation testing deliberately plants bugs to check the tests catch them.

# Maintenance & reliability
- Corrective (bugs), adaptive (new environment), perfective (enhancements), preventive (refactoring).
?? Maintenance types: corrective fixes bugs; adaptive adjusts to a new environment (new OS/hardware); perfective adds features or improves performance; preventive restructures code to avoid future problems.
- MTBF = MTTF + MTTR; availability = MTTF / MTBF. ROCOF, POFOD are reliability metrics.
?? MTTF = average time it runs before failing; MTTR = average time to repair; MTBF = MTTF + MTTR. Availability = fraction of time it is up = MTTF / MTBF (98 h up, 2 h repair → 98%).
- Configuration management: baselines, version control, change control board.
?? Configuration management keeps control of versions. A baseline is an approved version that can only be changed through a formal change request, so everyone works from the same known state.
`);

ISRO.addNotes('sec', 'Information Security', `
# Security goals (X.800 services)
| Service | Meaning |
?? The basic security goals (from the X.800 standard). Confidentiality: only authorised people can read it. Integrity: it has not been altered. Availability: it is there when needed. Non-repudiation: the sender cannot later deny sending it. ISRO 2025 Q10 asked exactly these definitions.
|---|---|
| Confidentiality | Protection from unauthorised disclosure |
| Integrity | Data arrives exactly as sent |
| Availability | Accessible when needed (DoS attacks this) |
| Authentication | Proving identity |
| Non-repudiation | Sender cannot deny having participated |
| Access control | Preventing unauthorised use of a resource |

# Symmetric cryptography
- Same key both sides; n users need n(n−1)/2 keys (16 users → 120). Public key needs 2n keys (n pairs).
?? With symmetric encryption every pair of people needs its own secret key: 16 people → 16 × 15 / 2 = 120 keys. With public-key crypto each person needs only one key pair (2 keys) → 32 keys total.
- DES: 64-bit block, 56-bit key, 16 Feistel rounds (broken by brute force). 3DES: 112/168-bit effective. AES (Rijndael): 128-bit block, keys 128/192/256 → 10/12/14 rounds, SPN.
?? DES is the old standard: 56-bit key, now breakable by brute force. AES is today's standard: 128-bit blocks and keys of 128, 192 or 256 bits, with 10, 12 or 14 rounds of scrambling.
- An n-bit key → 2ⁿ possible keys.
?? Each extra key bit doubles the number of possible keys: an n-bit key has 2ⁿ possibilities — that is what an attacker must try.
- Modes: ECB (identical blocks → identical ciphertext, avoid), CBC (IV, chaining), CFB/OFB/CTR (stream-like), GCM (authenticated encryption).
?? Block ciphers encrypt fixed-size blocks; the mode decides how blocks are chained. ECB encrypts each block separately, so identical blocks look identical (patterns leak — avoid). CBC mixes in the previous block. GCM also detects tampering.
- Classical: Caesar (shift), monoalphabetic substitution, Vigenère (polyalphabetic), Playfair, Hill, rail-fence/columnar (transposition). One-time pad: perfect secrecy.
?? Classical ciphers: Caesar shifts every letter by a fixed amount (ISRO → LVUR with shift 3). Vigenère uses a keyword so the shift changes letter to letter. Transposition ciphers rearrange letters instead of replacing them. A one-time pad with a truly random single-use key is unbreakable.

# Public-key cryptography
- RSA: choose p, q; n = pq; φ = (p−1)(q−1); pick e coprime to φ; d = e⁻¹ mod φ. Encrypt c = mᵉ mod n, decrypt m = cᵈ mod n. Security: factoring.
?? RSA: pick two primes p and q, multiply to get n, compute φ = (p−1)(q−1). Choose e, then find d so that e × d leaves remainder 1 when divided by φ. Anyone can encrypt with (e, n); only the holder of d can decrypt. It is safe because factoring a huge n back into p and q is extremely hard.
> p = 11, q = 13 → φ = 120; d = 7 ⇒ e = 103 since 7 × 103 = 721 = 6 × 120 + 1.
?? ISRO 2025 Q38 worked out: φ = 10 × 12 = 120. Try each option: 7 × 103 = 721, and 721 − 6 × 120 = 1. So e = 103 is the matching public key.
- Diffie-Hellman: A = gᵃ mod p, B = gᵇ mod p, shared key gᵃᵇ mod p. Discrete log hardness; vulnerable to MITM without authentication.
?? Diffie-Hellman lets two people create a shared secret over a public channel: each keeps a private number, publishes g^{private} mod p, and combines the other's public value with their own private one — both get the same result. An attacker in the middle can fool both unless the messages are authenticated.
- ECC: same security with much shorter keys (256-bit ECC ≈ 3072-bit RSA).
?? Elliptic-curve cryptography gives the same security as RSA with far shorter keys, which saves bandwidth and computation — useful for small devices.
- Confidentiality → encrypt with receiver's public key. Signature → sign with sender's private key, verify with sender's public key.
?? To send a secret: lock it with the receiver's public key (only their private key opens it). To sign: use your own private key; anyone can verify with your public key that it really came from you.
- Asymmetric crypto provides confidentiality, authentication, key exchange — not DoS protection.
?? Public-key crypto can hide data, prove identity and exchange keys. It cannot stop a flood of traffic (denial of service) — ISRO 2023 Q74.

# Hashes & MACs
- Hash: fixed output, one-way, collision resistant; **no key** (message digest). MD5 128-bit, SHA-1 160-bit (both broken), SHA-256, SHA-3.
?? A hash function turns any data into a fixed-size fingerprint. It is one-way (cannot recover the data) and it should be practically impossible to find two inputs with the same hash. It uses no key — ISRO 2025 Q9.
- Birthday attack: ~2^{n/2} work for an n-bit hash.
?? Birthday paradox: with only 23 people there is a 50% chance two share a birthday. Similarly, finding any two inputs with the same n-bit hash takes only about 2^{n/2} tries, not 2ⁿ.
- MAC/HMAC: keyed hash → integrity + authentication (not non-repudiation). Digital signature adds non-repudiation.
?? A MAC is a hash mixed with a secret key, so the receiver can check the message was not altered and came from someone who knows the key. Because both sides share the key, it cannot prove to a third party who sent it — signatures can.

# PKI & protocols
- X.509 certificates signed by a CA; revocation via CRL/OCSP. (X.25 is an old WAN standard!)
?? A certificate binds a name to a public key and is signed by a trusted Certificate Authority. X.509 is the certificate format (ISRO 2025 Q15). X.25 is an unrelated old network standard — a deliberate trap.
- TLS: handshake (asymmetric: authenticate + key exchange) → symmetric session keys. HTTPS = HTTP over TLS (443).
?? TLS (the S in HTTPS) uses public-key crypto only at the start to verify the server and agree on a key; the bulk data is then encrypted with fast symmetric crypto.
- IPsec: AH = integrity + authentication (no encryption). ESP = encryption (+ optional integrity). Transport mode protects payload; **tunnel mode encrypts the whole original packet, hiding internal IPs** (site-to-site VPN).
?? IPsec secures IP packets. AH only proves integrity/origin (no secrecy). ESP encrypts. Tunnel mode wraps the entire original packet, including the internal IP addresses, inside a new one — so ESP in tunnel mode gives confidentiality, integrity and hides private IPs (ISRO 2025 Q36).
- SSH/SFTP encrypt; SNMPv3 encrypts; DNSSEC only signs (no confidentiality).
?? Which protocols encrypt: SSH, SFTP, SNMPv3, HTTPS do. DNSSEC only signs DNS answers so they cannot be forged; the data itself is still readable (ISRO 2025 Q12).
- Kerberos: KDC (AS + TGS), tickets, symmetric keys, timestamps.
?? Kerberos is a login system where a trusted server issues time-limited "tickets"; you show a ticket to each service instead of sending your password around.

# Network defence
- Firewalls: packet filter (L3/L4), stateful (tracks connections), application proxy (L7), circuit-level gateway. Firewalls stop network scanning, not physical attacks.
?? Firewall types: a packet filter checks addresses and ports; a stateful firewall remembers connections; an application proxy understands the actual protocol content. Firewalls only see network traffic, so they can block network scans but not someone stealing a laptop or reading over your shoulder.
- Ingress filtering blocks malicious incoming traffic; egress filtering stops data leakage. NAT hides internal hosts. DMZ hosts public servers.
?? Ingress filtering stops bad traffic coming in; egress filtering stops sensitive data going out. NAT hides internal addresses behind one public IP. A DMZ is a separate zone for public servers (web, mail) so a break-in there does not reach the internal network.
- IDS (detects, alerts) vs IPS (inline, blocks); signature vs anomaly based. Honeypots lure attackers.
?? An IDS watches traffic and raises alarms; an IPS sits in the path and can block attacks. Signature-based = matches known attack patterns; anomaly-based = flags unusual behaviour.
- VPN: encrypted tunnel over public network.
?? A VPN creates an encrypted "tunnel" over the public Internet, so traffic between two sites or a laptop and the office is private.

# Attacks
| Attack | Notes |
?? Common attacks to recognise by name — ISRO frequently asks "which attack is …?" or "what causes …?". E.g. ping of death = oversized packet overflowing a buffer; ARP spoofing = lying about which MAC owns an IP to intercept traffic; SQL injection = sneaking SQL commands through input fields.
|---|---|
| DoS / DDoS | Exhaust resources; botnets |
| SYN flood | Half-open TCP connections → SYN cookies |
| Ping of death | Oversized ICMP → buffer overflow |
| Smurf | ICMP broadcast amplification |
| ARP spoofing | Poison IP-MAC mapping → MITM |
| MAC cloning | Impersonate NIC identity |
| OS fingerprinting | Determine OS name/version (Nmap) |
| Replay | Resend captured messages → nonces/timestamps |
| SQL injection | Prepared statements |
| XSS / CSRF | Script injection / forged requests |
| Buffer overflow | Bounds checks, canaries, ASLR, DEP |
| Phishing | User tricked into revealing data |
| Zero-day | Unknown, unpatched vulnerability |
- CAPTCHA stops automated scripted attacks. Salted, slow password hashes (bcrypt/Argon2) stop rainbow tables.
?? CAPTCHA asks a puzzle humans solve easily but bots cannot, stopping automated scripts. Passwords should be stored as slow, salted hashes so attackers cannot use precomputed tables.
- Malware: virus (needs host), worm (self-propagating), trojan (disguised), ransomware, rootkit (hides), logic bomb, spyware, keylogger.
?? Malware types: a virus attaches to files and needs a user to run them; a worm spreads by itself across the network; a trojan pretends to be useful software; ransomware encrypts files for money; a rootkit hides itself deep in the system.
- Physical/social: dumpster diving, shoulder surfing, tailgating, pretexting — firewalls can't help.
?? Social and physical attacks bypass technology: searching rubbish for papers, watching someone type a password, following an employee through a secure door. Only training and physical security help.

# Access control models
- DAC (owner decides), MAC (labels/clearances — Bell-LaPadula confidentiality: no read up, no write down; Biba integrity: no read down, no write up), RBAC (roles), ABAC (attributes).
?? Access control models. DAC: the owner decides who can access. MAC: the system enforces labels like Secret/Top Secret — Bell-LaPadula keeps secrets from leaking down ("no read up, no write down"). RBAC: permissions come from your job role.
- MFA: something you know + have + are.
?? Multi-factor authentication combines different kinds of proof: something you know (password), have (phone/token) and are (fingerprint). Two passwords are still only one factor.
`);

ISRO.addNotes('ai', 'AI & Machine Learning', `
# Agents
- PEAS: Performance, Environment, Actuators, Sensors.
?? PEAS describes an agent's task. For a self-driving car: Performance = safety and speed; Environment = roads and traffic; Actuators = steering, brakes; Sensors = cameras, lidar.
- Agent types: simple reflex, model-based reflex, goal-based, utility-based, learning agents. ("Unity based" is not one.)
?? Agent types from simple to smart: simple reflex (if-then rules on the current input), model-based (remembers state), goal-based (plans to reach a goal), utility-based (chooses the best outcome), learning (improves with experience). "Unity based" was the fake option in ISRO 2025.
- Environment properties: observable, deterministic, episodic, static, discrete, single/multi-agent.
?? Environment properties: fully observable (sees everything, like chess) vs partially (like poker); deterministic vs random; static vs changing while you think; discrete vs continuous.

# Search
| Algorithm | Complete | Optimal | Time | Space |
?? Search algorithms compared. "Complete" = always finds a solution if one exists; "optimal" = finds the cheapest. BFS explores level by level (complete, optimal for equal costs, uses lots of memory). DFS dives deep (little memory, may get lost). IDDFS repeats DFS with growing depth — gets the best of both.
|---|---|---|---|---|
| BFS | Yes | Yes (unit costs) | b^{d} | b^{d} |
| Uniform cost | Yes | Yes | — | — |
| DFS | No (infinite) | No | b^{m} | bm |
| Depth-limited | No | No | b^{l} | bl |
| IDDFS | Yes | Yes (unit) | b^{d} | bd |
| Greedy best-first | No | No | — | — |
| A* | Yes | Yes if h admissible | — | — |
- A*: f(n) = g(n) + h(n). Admissible: h never overestimates. Consistent: h(n) ≤ c(n, n′) + h(n′).
?? A* ranks nodes by cost so far (g) + estimated cost to the goal (h). If h never overestimates (admissible), A* is guaranteed to find the cheapest path. E.g. straight-line distance on a map never overestimates road distance.
- Local search: hill climbing (local maxima, plateaus, ridges), random restart, simulated annealing (accept worse with prob e^{−ΔE/T}), local beam, genetic algorithms (selection, crossover, mutation).
?? Local search keeps one current solution and improves it. Hill climbing always moves uphill but can get stuck on a small peak. Simulated annealing sometimes accepts a worse move (more often early on) to escape. Genetic algorithms evolve a population by selection, crossover and mutation.
- Games: minimax; alpha-beta prunes branches, best case O(b^{d/2}).
?? For two-player games, minimax assumes the opponent plays their best: you maximise, they minimise. Alpha-beta pruning skips branches that cannot change the decision, so it can search about twice as deep in the same time.
- CSP: backtracking + MRV + degree heuristic + least-constraining value + forward checking / arc consistency (AC-3).
?? Constraint satisfaction (like Sudoku): assign values one variable at a time, backtracking on conflicts. MRV picks the variable with the fewest remaining legal values first — failing early saves time.

# Knowledge & reasoning
- Propositional and first-order logic. FOL connectives: ¬ ∧ ∨ ⇒ ⇔; quantifiers ∀ ∃.
?? Propositional logic uses true/false statements joined by connectives. First-order logic adds objects, relations and quantifiers (∀ for all, ∃ there exists). "<>" is not an FOL connective (ISRO 2023 Q61).
- Inference: modus ponens, modus tollens, resolution (needs CNF), unification.
?? Modus ponens: "if P then Q" and "P" → conclude Q. Modus tollens: "if P then Q" and "not Q" → conclude not P. Resolution is a single rule that can prove anything provable, once statements are in CNF.
- Forward chaining = data-driven; backward chaining = goal-driven (Prolog).
?? Forward chaining starts from known facts and applies rules to derive new facts until the goal appears. Backward chaining starts from the goal and works back to find facts that support it (how Prolog works).
- Uncertainty: Bayes rule; Bayesian networks (DAG + CPTs; hybrid = discrete + continuous variables); HMMs; fuzzy logic (membership ∈ [0, 1]).
?? Bayes' rule updates beliefs with evidence. A Bayesian network is a graph of variables with arrows for direct influence and probability tables; a hybrid network mixes discrete and continuous variables. Fuzzy logic allows partial truth, like 0.7 "hot".

# Machine learning
- Supervised (labelled data): regression, classification. Unsupervised: clustering, dimensionality reduction. Reinforcement: agent learns from rewards (Q-learning, SARSA, DQN, policy gradients).
?? Supervised learning learns from examples with the right answers (labelled), e.g. emails marked spam/not spam. Unsupervised finds structure in unlabelled data (grouping customers). Reinforcement learning learns by trial and error from rewards (game-playing, robots).
| Algorithm | Type |
?? A quick map of ML algorithms to their type. Decision trees handle both classification (category) and regression (number). K-means groups data into k clusters; PCA reduces the number of features while keeping most information.
|---|---|
| Linear / logistic regression | Supervised |
| Decision tree (ID3 = info gain, CART = Gini) | Classification **and** regression |
| Random forest, gradient boosting | Ensembles |
| SVM | Max-margin hyperplane, kernels |
| KNN | Lazy, instance-based |
| Naive Bayes | Probabilistic, assumes conditional independence |
| K-means | Partitional clustering |
| Agglomerative / divisive | Hierarchical clustering |
| DBSCAN | Density-based clustering |
| PCA | Dimensionality reduction |
- Bias-variance: high bias → underfitting; high variance → overfitting (fix with regularisation, more data, dropout, cross-validation, early stopping).
?? Underfitting (high bias): the model is too simple and does poorly even on training data. Overfitting (high variance): it memorises the training data and fails on new data. Cures for overfitting: more data, simpler model, regularisation, dropout.
- Metrics: accuracy = (TP + TN)/total; precision = TP/(TP + FP); recall = TP/(TP + FN); F1 = 2PR/(P + R).
?? Precision = of the items predicted positive, how many really are. Recall = of all real positives, how many were found. Example: TP 40, FP 10 → precision 80%. F1 balances the two.
- Entropy H = −Σ pᵢ log₂ pᵢ (50/50 → 1 bit). Information gain = parent entropy − weighted child entropy.
?? Entropy measures disorder: a 50/50 mix has entropy 1 (maximally uncertain), a pure group has 0. Decision trees choose the split that reduces entropy the most (information gain).

# Neural networks
- Perceptron learns only linearly separable functions (no XOR). MLP with hidden layer can.
?? A single perceptron draws one straight line to separate classes, so it cannot learn XOR (whose 1s are on a diagonal). Adding a hidden layer lets the network learn curved boundaries.
- Activations: sigmoid (0, 1), tanh (−1, 1), ReLU max(0, x), softmax (probabilities).
?? Activation functions add non-linearity to neurons. Sigmoid squashes to 0–1, tanh to −1–1, ReLU passes positives and zeroes negatives (fast, popular), softmax turns scores into probabilities that sum to 1.
- Backpropagation = chain rule + gradient descent. Vanishing gradients with sigmoid/tanh in deep nets.
?? Backpropagation computes how much each weight contributed to the error (using the chain rule of calculus), then gradient descent nudges every weight to reduce the error.
- CNN → images; RNN/LSTM/GRU → sequences; Transformers (attention) → language models.
?? Which network for which data: CNNs scan images with small filters; RNNs/LSTMs handle sequences step by step; Transformers use attention to relate all positions at once — the basis of modern language models.

# Uses of AI (ISRO flavoured)
Trend analysis, cyber-incident analysis, pattern recognition in satellite imagery, anomaly detection in telemetry, autonomous navigation.
?? Ways AI helps an organisation like ISRO: spotting trends, analysing cyber incidents, recognising patterns in satellite images, detecting anomalies in telemetry. ISRO 2025 Q17 answer was "all of the above".
`);

ISRO.addNotes('cloud', 'Cloud, Big Data & Virtualization', `
# Cloud computing
- NIST essential characteristics: on-demand self-service, broad network access, resource pooling (multi-tenancy), rapid elasticity, measured service.
?? NIST's definition of cloud: you get resources yourself through a web console (self-service), from anywhere (network access), from a shared pool (many customers on the same hardware), they grow and shrink quickly (elasticity), and you pay for what you use (measured, like an electricity meter).
- **Elasticity** = scale resources up and down automatically with load. Scalability = ability to grow.
?? Elasticity means resources automatically grow when traffic rises and shrink when it falls — e.g. a results website adds servers on results day and releases them after (ISRO 2025 Q21).
| Service model | You manage | Examples |
?? Service models by how much the provider handles. IaaS gives you virtual machines (you install the OS and apps). PaaS gives a ready platform (you just deploy code). SaaS is finished software you simply use, like Gmail. Serverless runs individual functions and bills per call.
|---|---|---|
| IaaS | OS, runtime, apps, data | AWS EC2, Azure VMs, OpenStack |
| PaaS | Apps, data | Google App Engine, Heroku |
| SaaS | Just use it | Gmail, Office 365, Salesforce |
| FaaS / serverless | Functions | AWS Lambda, Azure Functions |
- Deployment: public, private (single organisation, on/off premises), community, hybrid. **Cloud bursting**: overflow from private to public at peak.
?? Deployment models: public cloud is shared by everyone (AWS); private cloud serves one organisation only (ISRO 2023 Q67); community cloud is shared by similar organisations; hybrid mixes them. Cloud bursting = when the private cloud is full, the overflow goes to the public cloud temporarily (ISRO 2023 Q68).
- Horizontal scaling (scale out, more machines) vs vertical (scale up, bigger machine).
?? Two ways to handle more load: add more machines (horizontal, "scale out") or make one machine bigger (vertical, "scale up"). Cloud systems prefer scaling out.
- SLA: guaranteed uptime etc. (99.9% ≈ 8.76 h/year downtime; 99.99% ≈ 52.6 min).
?? An SLA is the provider's written promise, e.g. 99.9% uptime, which still allows about 8.8 hours of downtime per year; 99.99% allows about 53 minutes.
- Edge / fog computing: process near the data source — low latency.
?? Edge/fog computing processes data close to where it is produced (on the device or a nearby node) instead of sending everything to a distant data centre — lower delay and less bandwidth.

# Virtualization
- Hypervisor (VMM) runs multiple VMs (multiple OS simultaneously). Dual boot runs only one at a time.
?? A hypervisor lets one physical computer run several virtual machines, each with its own OS, at the same time. Dual boot only lets you choose one OS at start-up (ISRO 2023 Q69).
- **Type-1 (bare metal)**: runs directly on hardware — VMware ESXi, Xen, Microsoft Hyper-V, KVM. **Type-2 (hosted)**: runs on a host OS — VirtualBox, VMware Workstation.
?? Type-1 hypervisors run directly on the hardware with no OS underneath (servers, data centres). Type-2 hypervisors are apps installed on a normal OS (VirtualBox on your laptop). ISRO 2025 Q22 asked exactly this match.
- Full virtualization: unmodified guest (binary translation or hardware assist). **Para-virtualization**: guest OS is modified to make hypercalls (Xen). Hardware-assisted: Intel VT-x, AMD-V.
?? Full virtualization runs an unmodified guest OS that does not know it is virtual. Para-virtualization changes the guest OS so it calls the hypervisor directly (hypercalls) — faster, used by Xen (ISRO 2023 Q70). Hardware assist (Intel VT-x, AMD-V) adds CPU support to make full virtualization fast.
- Containers (Docker) share the host kernel (namespaces + cgroups) — lighter than VMs. Kubernetes orchestrates containers.
?? A container packages an app with its libraries but shares the host's OS kernel, so it starts in seconds and uses little memory compared with a full VM. Kubernetes manages many containers across many machines.
- Live migration moves a running VM between hosts.
?? Live migration moves a running VM from one physical server to another with almost no downtime — used for maintenance and load balancing.

# Big Data
- 5 Vs: Volume, Velocity, Variety, Veracity, Value (Visualisation is not one of the core Vs).
?? Big Data is described by its Vs: huge Volume, fast Velocity (streaming in), many Varieties of format, uncertain Veracity (quality), and Value. Visualisation is not one of them — the trap in ISRO 2025 Q23.
- Structured (fixed schema tables) / semi-structured (XML, JSON) / unstructured (text, images, video).
?? Structured data fits neat tables (bank records). Semi-structured has tags but no fixed table shape (XML, JSON). Unstructured has no structure at all (photos, videos, free text). ISRO 2025 Q27.
- **Hadoop**: HDFS (NameNode = metadata master, DataNodes store blocks; default 128 MB blocks, replication 3; write-once-read-many; good for high-throughput batch, **bad for low latency and multiple concurrent writers**), MapReduce (map → shuffle & sort → reduce), YARN (resource management).
?? Hadoop stores huge files by chopping them into 128 MB blocks, each copied to 3 machines (DataNodes); the NameNode keeps the map of where blocks are. It is built for reading big files in batches — not for quick lookups or many programs writing the same file (ISRO 2023 Q63, 2025 Q24).
- Ecosystem: Hive (SQL-like), Pig (data flow), HBase (column store on HDFS), Sqoop (RDBMS import), Flume (log ingest), ZooKeeper (coordination), Oozie (workflows).
?? Tools around Hadoop: Hive lets you query with SQL-like language; Pig is a scripting language for data flows; HBase is a database on top of HDFS; Sqoop imports from relational databases; ZooKeeper coordinates the cluster.
- Spark: in-memory, RDD/DataFrames, much faster for iterative jobs. **Stream processing**: Apache Flink, Storm, Spark Streaming, Kafka Streams. Kafka = distributed event log / pub-sub.
?? Spark keeps data in memory between steps, so it is much faster than disk-based MapReduce for repeated processing. For live streaming data use Flink, Storm or Spark Streaming (ISRO 2025 Q25: Flink). Kafka is a high-speed message pipeline that streams events between systems.
- NoSQL for unstructured data: Cassandra (distributed, peer-to-peer, AP), MongoDB (documents), HBase, Redis, Neo4j.
?? NoSQL databases handle unstructured or rapidly changing data and spread across many servers. Cassandra is a distributed database with no master node (ISRO 2023 Q66).
- CAP theorem, eventual consistency, consistent hashing for partitioning.
?? Distributed storage basics: CAP says you must trade consistency against availability during network failures; eventual consistency means replicas agree after a while; consistent hashing spreads data across nodes so adding a node moves little data.

# Misc tools
- JMX = Java Management Extensions (monitor/manage Java apps via MBeans).
?? JMX is the standard Java API for monitoring and managing running Java applications (ISRO 2023 Q64). The distractors JVN and JMY do not exist; JVM is the virtual machine itself.
- Splunk = log analytics/SIEM; ERDPlus = ER diagram tool (not big data processing).
?? Splunk analyses machine logs (popular for security monitoring). ERDPlus is just a tool for drawing ER diagrams — not a Big Data processing tool.
`);

ISRO.addNotes('apt', 'Aptitude & Reasoning', `
# Part B facts
- 15 questions, 20 marks, **no negative marking** — answer everything.
?? Part B rule: no negative marking. Even if a question is a picture puzzle you cannot solve, pick something — 25% chance of free marks.
- Types seen: figure series/odd one out, seating arrangement, syllogism, statement–conclusion, course of action, number series, data interpretation (table/graph), calendar, mensuration, mixtures, situational judgement.
?? These are the question types that appeared in 2023 and 2025. Knowing the type in advance lets you recognise the method quickly.

# Quantitative shortcuts
- Percent change = (new − old)/old × 100. Successive changes a% and b%: a + b + ab/100.
?? Percentage change is always relative to the old value. Two successive changes do not simply add: +20% then −10% → 20 − 10 + (20 × −10)/100 = +8%.
- Profit% on cost; marked price with discount: SP = MP(1 − d). Mark up 20%, discount 10% → +8%.
?? Marking up by 20% then giving 10% discount: price becomes 1.2 × 0.9 = 1.08 of cost, so 8% profit.
- SI = PRT/100. CI amount = P(1 + r/100)ⁿ. Sum doubles in n years at SI → rate = 100/n %.
?? Simple interest grows by the same amount each year (P × R × T / 100). Compound interest earns interest on interest. If money doubles in 5 years at SI, the interest equals the principal in 5 years → 20% per year.
- Work: A in a days, B in b days → together ab/(a + b). Pipes: filling positive, emptying negative.
?? Work problems: think in "work per day". A finishes 1/a of the job per day, B 1/b; together 1/a + 1/b. For pipes, an emptying pipe subtracts: fill 1/4, empty 1/6 → net 1/12 → 12 hours.
- Speed: km/h × 5/18 = m/s. Average speed for equal distances = 2xy/(x + y). Boat: stream = (down − up)/2.
?? Convert km/h to m/s by × 5/18 (36 km/h = 10 m/s). For equal distances at two speeds the average speed is NOT the simple average — it is 2xy/(x + y) (40 and 60 → 48). Stream speed is half the difference of downstream and upstream speeds.
- Trains: time to pass a pole = length/speed; a platform = (train + platform)/speed.
?? A train passing a pole only covers its own length; passing a platform it covers its length plus the platform's. Time = distance ÷ speed.
- Mixtures: keep one component fixed and change the other (sugar 15 : salt 30 → add 45 sugar for 2 : 1).
?? In mixture problems, one ingredient usually stays fixed. ISRO 2025: 45 L at 1 : 2 has 15 sugar and 30 salt. Salt stays 30; for 2 : 1 sugar must be 60 → add 45 L.
- Max area for fixed perimeter → square. Scaling lengths by k scales area by k², volume by k³.
?? For a fixed perimeter, the square has the biggest area (perimeter 620 → side 155 → 24,025). If every length doubles, area becomes 4× and volume 8× (a cube of 8 m³ becomes 64 m³).
- Ages, ratios: split totals in ratio parts.
?? Split a total in a given ratio: ratio 3 : 5 with sum 48 → one part = 48/8 = 6 → 18 and 30.

# Series
- Check differences, then differences of differences, then ratios, then ×n + n / ×n − n / squares ± k / primes.
?? For "find the next/wrong number" series, try in order: differences between terms, differences of those, ratios, and mixed rules like ×2+1 or ×n + n. Squares, cubes and primes are also common.
> 7, 8, 18, 57, 228, 1165 — rule ×1+1, ×2+2, ×3+3, ×4+4 → 228 should be 232.
?? Worked example from ISRO 2023 Q92: multiply by 1, 2, 3, 4… and add the same number. 57 × 4 + 4 = 232, but the series shows 228 → that is the wrong number.

# Calendar & clocks
- Odd days: normal year 1, leap year 2; 100 years 5, 200 years 3, 300 years 1, 400 years 0. Day codes: 0 Sun … 6 Sat.
?? Odd days = days left over after full weeks. A normal year has 365 = 52 weeks + 1 day, a leap year 2. Add up odd days from a known reference to find the weekday; 0 = Sunday. (28 May 2006 was a Sunday.)
- Leap year: divisible by 4 and (not by 100 unless by 400).
?? A year is a leap year if divisible by 4 — except century years, which must be divisible by 400 (2000 yes, 1900 no).
- Clock angle = |30H − 5.5M|. Hands coincide 22 times a day; straight line 44 times; right angle 44 times.
?? The hour hand moves 0.5° per minute and the minute hand 6°, so the angle = |30 × hour − 5.5 × minutes|. At 3:40 → |90 − 220| = 130°.
- Mirror image time = 11:60 − given time (for times after 1:00).
?? In a mirror, the clock's time looks like 11:60 minus the real time. 4:20 → 7:40.

# Logical reasoning
- Syllogisms: draw Venn diagrams; "some A are B" ⇒ "some B are A". A conclusion must hold in **every** diagram. Complementary pair (Some + No on the same terms) → "either I or II follows".
?? Syllogisms: draw circles for each group. A conclusion is valid only if it is true in every possible drawing. "Some books are tables, some tables are mirrors" says nothing certain about books and mirrors — but "some are" and "none are" cannot both be false, so "either I or II" follows.
- Fact questions: accept only what must be true — "None of the statements is a known fact" is often right.
?? Fact-based questions: only accept what is definitely forced by the facts, not what is likely. If none is forced, choose "none is a known fact".
- Course of action: must be practical, solve/reduce the problem, not extreme (no "suspend everyone", "ban everything").
?? Courses of action should be sensible, practical steps that address the problem — not extreme punishments or abolishing the system. Usually "investigate" beats "suspend everyone".
- Assumptions underestimating/overestimating: think about who would misreport in the survey.
?? Survey/argument questions: if a figure is said to be an underestimate, look for the option where some people in the group hid the truth (dishonest people claiming to be honest).
- Seating: fix one person, draw the circle/square; corners face centre, mid-sides face out → directions flip.
?? Seating puzzles: draw the table, place the person with the most certain clue first. Remember people facing the centre and people facing outward have left and right reversed.
- Directions: track net N–S and E–W; distance by Pythagoras.
?? Direction puzzles: add up all north–south movement and all east–west movement separately, then use Pythagoras. 4 km south and 3 km east → 5 km away.
- Blood relations: draw a family tree, use symbols for gender.
?? Blood relations: draw a family tree with + for male and − for female. "My grandfather's only son" is simply my father.

# Situational judgement
- Choose the response that is honest, communicates with the right person (manager), and keeps work commitments — never deceive or abandon duty.
?? Situational judgement: the best answer is honest, professional and proactive — talk to the person responsible rather than avoid, deceive or go behind their back.
`);

ISRO.addNotes('formulas', 'Last-day formula sheet', `
# Numbers you must not get wrong
| Topic | Formula |
|---|---|
| Pipeline time | (k + n − 1) cycles; speedup → k |
?? A pipeline with k stages: the first instruction takes k cycles, then one instruction finishes every cycle. So n instructions take k + n − 1 cycles, and for big n you get up to k times speedup.
| Amdahl | 1 / ((1 − p) + p/s) |
?? If a fraction p of the work is sped up s times, the rest (1 − p) still runs at the old speed and limits the total speedup.
| AMAT | hit + miss rate × penalty |
?? Average memory access time: every access pays the hit time; the misses also pay the penalty.
| Cache bits | tag = addr − index − offset |
?? A memory address is split into tag | index | offset. Offset = log₂(block size), index = log₂(number of lines or sets); the tag is whatever bits remain.
| EAT (TLB) | h(t + m) + (1 − h)(t + 2m) |
?? With a TLB: on a hit, TLB + one memory access; on a miss, TLB + page-table access + memory access. Weight each by its chance.
| EAT (page faults) | (1 − p)m + p·service |
?? Average access with page faults: usually a normal memory access, but with probability p a very slow disk service.
| Page table size | (2^{VA}/page size) × PTE |
?? Number of pages (virtual space ÷ page size) multiplied by the size of one page-table entry.
| Deadlock-free | R ≥ n(k − 1) + 1 |
?? If every process could hold k − 1 units and still have one unit left in the system, someone can always finish — so no deadlock.
| fork() n times | 2ⁿ processes |
?? Every fork() doubles the number of processes.
| Stop-and-wait | 1/(1 + 2a), a = Tp/Tt |
?? a = propagation delay / transmission time. Stop-and-wait uses the link only 1 out of (1 + 2a) of the time.
| GBN / SR window | 2ⁿ − 1 / 2ⁿ⁻¹ |
?? Max outstanding frames with n-bit sequence numbers: Go-Back-N 2ⁿ − 1, Selective Repeat half the space 2ⁿ⁻¹.
| CSMA/CD | L_min = 2 × B × Tp |
?? Minimum frame length for collision detection: the frame must last a full round trip (2 × propagation delay) at bandwidth B.
| ALOHA | 18.4% / slotted 36.8% |
?? Best possible use of the channel with random access: 1/(2e) for pure ALOHA, 1/e for slotted.
| Nyquist / Shannon | 2B log₂L / B log₂(1 + S/N) |
?? Maximum data rate: Nyquist for a noiseless channel with L levels; Shannon for a noisy channel with signal-to-noise ratio S/N.
| Hosts in /n | 2^{32−n} − 2 |
?? A /n network leaves 32 − n host bits; subtract 2 for the network and broadcast addresses.
| BDP window | bandwidth × RTT |
?? To keep a link fully busy, the window must hold one round-trip's worth of data: bandwidth × RTT.
| Hamming bits | 2^{r} ≥ m + r + 1 |
?? Minimum parity bits r for m data bits so every single-bit error position can be identified.
| Error detect / correct | d + 1 / 2d + 1 |
?? Minimum Hamming distance needed to detect d errors, and to correct d errors.
| Cyclomatic | E − N + 2P |
?? Number of independent paths in code = edges − nodes + 2 (per connected component), i.e. decisions + 1.
| FP | UFP × (0.65 + 0.01 ΣF) |
?? Function points = unadjusted points × complexity adjustment (0.65 + 0.01 × sum of 14 ratings).
| PERT | (o + 4m + p)/6 |
?? PERT expected time weights the most likely estimate 4 times: (optimistic + 4 × likely + pessimistic) / 6.
| Availability | MTTF / (MTTF + MTTR) |
?? Fraction of time a system is working: mean time to failure ÷ (that + mean time to repair).
| RSA | ed ≡ 1 mod (p−1)(q−1) |
?? RSA private exponent d is the inverse of e modulo φ = (p − 1)(q − 1).
| Symmetric keys | n(n − 1)/2 |
?? Symmetric crypto needs a separate secret key for every pair of users.
| Euler planar | V − E + F = 2 |
?? For any connected planar drawing: vertices − edges + faces (including the outside) = 2.
| Planar bound | E ≤ 3V − 6 |
?? A simple planar graph with V ≥ 3 cannot have more than 3V − 6 edges; more edges ⇒ not planar.
| Handshake | Σ deg = 2E |
?? Sum of all vertex degrees equals twice the number of edges.
| Spanning trees Kₙ | n^{n−2} |
?? Number of different spanning trees of the complete graph on n labelled vertices.
| Catalan | C(2n, n)/(n + 1) |
?? Catalan number: counts BST shapes, stack permutations, valid bracket sequences (1, 1, 2, 5, 14, 42…).
| Binary tree | n₀ = n₂ + 1 |
?? In any binary tree, leaves = nodes with two children + 1.
| Heap children | 2i, 2i + 1 |
?? In an array-stored heap (index from 1), the children of position i are at 2i and 2i + 1.
| AVL min nodes | N(h) = N(h−1) + N(h−2) + 1 |
?? Fewest nodes an AVL tree of height h can have — grows like Fibonacci (1, 2, 4, 7, 12, 20).
| IEEE 754 single | 1 / 8 (bias 127) / 23 |
?? IEEE 754 single precision bit layout: 1 sign bit, 8 exponent bits stored with +127, 23 fraction bits.
| 2's complement range | −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1 |
?? Range of an n-bit two's complement number (8 bits: −128 to 127).
| Relations on n-set | 2^{n²} |
?? Number of possible relations on a set of n elements (each of n² pairs in or out).
| Boolean functions | 2^{2ⁿ} |
?? Number of different Boolean functions of n variables.
| Minimal DFA nth from right | 2ⁿ |
?? Minimal DFA for "n-th symbol from the right is a" must remember the last n symbols.
| CNF derivation steps | 2n − 1 |
?? In Chomsky Normal Form, deriving a string of length n takes exactly 2n − 1 rule applications.

# Repeated-pattern answers
- S → aSb | T, T → bT | b ⇒ aᵐbⁿ, m < n.
?? Seen in both 2023 and 2025: rule S → aSb pairs every a with a b, and T adds at least one more b, so b's always outnumber a's.
- (a*b)* + (b*a)* = (a + b)*.
?? One side covers every string ending in b, the other every string ending in a, and both include the empty string — together that is every string.
- Ambiguous E → E+E | E×E | id: "id+id×id" has exactly 2 parse trees.
?? Because + and × have no precedence in this grammar, id + id × id can be grouped (id + id) × id or id + (id × id): exactly two trees.
- Durability holds "always, even if there is failure of any kind".
?? Durability is absolute: a committed transaction must survive power cuts, OS crashes and disk failures (thanks to logs and backups).
- Trap = software interrupt. Linux threads = one-to-one. Loader assigns segment numbers.
?? Three one-line facts from 2023: a trap is caused by software; Linux maps each user thread to a kernel thread; the loader assigns segment numbers.
- Para-virtualization modifies the guest OS. Type-1 = bare metal.
?? Para-virtualization is the one where the guest OS is modified. Type-1 hypervisors run directly on hardware.
- DNSSEC doesn't encrypt; IPsec ESP tunnel hides private IPs; blocking ICMP breaks PMTU discovery.
?? Three network-security facts: DNSSEC signs but does not encrypt; ESP in tunnel mode hides internal addresses; ICMP is needed for path-MTU discovery.
- MC/DC = Modified Condition/Decision Coverage. CMM: Initial, Repeatable, Defined, Managed, Optimizing.
?? MC/DC = Modified Condition/Decision Coverage, used for safety-critical software. CMM order: Initial, Repeatable, Defined, Managed, Optimizing.
- Message digest uses no key. X.509 = PKI certificates. CAPTCHA → automated attacks. Ping of death → buffer overflow.
?? Quick security facts: a plain hash uses no key; X.509 is the certificate format; CAPTCHA blocks bots; ping of death overflows a buffer.
`);
