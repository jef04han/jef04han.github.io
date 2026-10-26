/* Study notes (Module 3). Each chapter is a small markdown dialect rendered by app.js:
   # / ## / ### headings, - lists, | tables |, > tips, **bold**, ``` code blocks. */

ISRO.addNotes('guide', 'Exam blueprint & strategy', `
# What the paper looks like
| Part | Questions | Marks | Negative |
|---|---|---|---|
| A — Discipline specific (CS) | 80 | 1 each = 80 | −0.33 per wrong |
| B — Ability test (aptitude) | 15 | 20 total (mix of 1 & 2 mark) | None |

- Duration: 120 minutes, OMR, single correct option. 95 questions → about 75 s per question.
- The written test only shortlists for the interview — but the cut-off is usually high, so accuracy matters more than attempting everything.
- **Part B has no negative marking — attempt every Part B question.**

# Where the marks came from (2023 + 2025 combined)
| Area | 2023 | 2025 | Priority |
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

> Questions repeat! 2025 Q80 was word-for-word 2023 Q57 (S → aSb | T, T → bT | b). The TOC questions in both years use the same template: "Consider the DFA/NFA/CFG below…". Practise the past papers until you can answer them instantly.

# Negative-marking maths
- A wrong answer costs 1/3. If you can eliminate **one** option, guessing among 3 has expected value 1/3 − 2/3·1/3 = +0.11 → worth it.
- If you cannot eliminate anything, expected value = 1/4 − 3/4·1/3 = 0 → skip unless you have a hunch.
- Target: 55+ attempted Part A with ≥ 85% accuracy and all 15 of Part B.

# Three-day plan (27 → 29 Oct)
1. **Day 1:** Both solved past papers (Study tab) → OS, CN, DBMS notes → quiz 150 questions from those subjects.
2. **Day 2:** TOC, Compiler, DL, COA, DS/Algo notes → quiz 150 → review every wrong answer (Quiz › Wrong).
3. **Day 3 (morning of 28th):** Security, AI, Cloud, SE notes (fast, factual) → quiz the remaining → evening: Formula sheet + starred questions only. Sleep early.

# Exam-hall routine
- Pass 1 (≈ 50 min): answer everything you know instantly; mark doubtful ones in the booklet.
- Pass 2 (≈ 35 min): numericals (pipelining, subnetting, paging, scheduling).
- Pass 3: Part B — never leave blank. Bubble the booklet SET code on the OMR.
`);

ISRO.addNotes('ds', 'Data Structures', `
# Arrays
- Row-major: Loc(A[i][j]) = B + ((i − lr)·N + (j − lc))·w where N = number of columns.
- Column-major: Loc(A[i][j]) = B + ((j − lc)·M + (i − lr))·w where M = number of rows.
- Lower-triangular n×n has n(n+1)/2 non-zeros; tri-diagonal has 3n − 2.
- A string of length m has m(m+1)/2 non-empty substrings and 2^{m} subsequences.

# Stack
- LIFO. push/pop/peek O(1). Used for recursion, expression evaluation, DFS, undo, parenthesis matching, backtracking.
- Infix → postfix: operands go straight to output; operator waits while stack-top has higher (or equal, if left-assoc) precedence. ^ is right-associative.
- Evaluate postfix left → right with an operand stack; prefix right → left.
- Number of valid stack permutations of n items = Catalan Cₙ = (2n)! / ((n+1)!·n!) → 1, 1, 2, 5, 14, 42.
> Example: postfix 6 2 3 + − 3 8 2 / + * → (6 − 5) × (3 + 4) = 7.

# Queue
- FIFO. Circular array of size n: empty when front == rear; full when (rear + 1) % n == front.
- Queue from 2 stacks (amortised O(1)); stack from 2 queues (one operation O(n)).
- Deque: insert/delete both ends. Priority queue: binary heap → insert O(log n), delete-min O(log n), find-min O(1).

# Linked lists
- Insert at head O(1); search/delete-by-value O(n); no random access, so binary search is O(n).
- Reverse iteratively with prev/curr/next. Detect cycle: Floyd (slow + fast pointer), O(1) space.
- Doubly linked: insertion between two nodes changes 4 pointers.

# Trees
| Fact | Formula |
|---|---|
| Max nodes, height h (root h = 0) | 2^{h+1} − 1 |
| Min height with n nodes | ⌈log₂(n+1)⌉ − 1 |
| Leaves vs degree-2 nodes | n₀ = n₂ + 1 |
| NULL pointers in n-node tree | n + 1 |
| Full binary tree with I internal nodes | L = I + 1, total 2I + 1 |
| Unlabelled shapes with n nodes / BSTs on n keys | Catalan Cₙ |
| Labelled binary trees | n! · Cₙ |

- Inorder of a BST is sorted. **Inorder + preorder** or **inorder + postorder** uniquely fixes a tree; preorder + postorder only for full binary trees.
- BST predecessor = max of left subtree; successor = min of right subtree. Deleting a 2-child node: copy successor, delete successor.
- Diameter in O(n): one post-order pass computing heights.

## Balanced trees
- **AVL:** balance factor ∈ {−1, 0, 1}. Height ≤ 1.44 log n. Min nodes N(h) = N(h−1) + N(h−2) + 1 → 1, 2, 4, 7, 12, 20. Rotations: LL → right, RR → left, LR → left-right, RL → right-left.
- **Red-black:** root & leaves black, no red-red, equal black-height → height ≤ 2 log₂(n+1).
- **B-tree (order m):** non-root nodes have ⌈m/2⌉ … m children; all leaves at the same level. **B+ tree:** records only in leaves, leaves linked → range queries; used for DB indexes.

## Heaps
- Complete binary tree in an array: children of i at 2i and 2i+1 (1-based), parent ⌊i/2⌋.
- Build-heap is **O(n)**; insert & delete O(log n); heap sort O(n log n), in-place, unstable.
- In a min-heap the maximum is in a leaf (positions ⌊n/2⌋+1 … n).

# Hashing
- Division method h(k) = k mod m with m prime, away from powers of 2.
- Chaining: works with load factor α > 1; unsuccessful search Θ(1 + α).
- Open addressing (α ≤ 1): linear probing → primary clustering; quadratic → secondary clustering; double hashing → best.
- Expected probes (open addressing, uniform hashing): unsuccessful 1/(1 − α).

# Graph representation
- Adjacency matrix: O(V²) space, O(1) edge lookup. Adjacency list: O(V + E).
- BFS uses a queue; DFS uses a stack/recursion. Both O(V + E) with lists, O(V²) with a matrix.
`);

ISRO.addNotes('algo', 'Algorithms', `
# Growth rates
1 < log log n < log n < √n < n < n log n < n² < n³ < n^{log n} < 2ⁿ < n! < nⁿ
- log(n!) = Θ(n log n); Σ 1/i = Θ(log n); Σ i^{k} = Θ(n^{k+1}).

# Recurrences — Master theorem
T(n) = aT(n/b) + f(n). Let c = log_b a.
1. f(n) = O(n^{c−ε}) → Θ(n^{c})
2. f(n) = Θ(n^{c}·logᵏ n) → Θ(n^{c}·log^{k+1} n)
3. f(n) = Ω(n^{c+ε}) and regularity → Θ(f(n))

| Recurrence | Result | Example |
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
- Selection sort makes the fewest swaps (n − 1). Insertion sort is best for nearly-sorted input.
- Identify the sort from intermediate arrays: insertion → prefix sorted, rest untouched; selection → prefix holds the overall smallest elements; bubble → suffix holds the largest.

# Greedy
- Works when greedy-choice property + optimal substructure hold.
- Huffman (merge two smallest), fractional knapsack (value/weight), activity selection (earliest finish), Kruskal, Prim, Dijkstra, optimal merge pattern.
- **Kruskal**: sort edges, add if no cycle (union-find): O(E log E). **Prim**: grow from a vertex: O(E log V) heap, O(V²) matrix.
- **Dijkstra**: non-negative weights; O((V + E) log V) binary heap, O(V²) array.

# Dynamic programming
| Problem | Time |
|---|---|
| 0/1 knapsack | O(nW) (pseudo-polynomial) |
| LCS / edit distance | O(mn) |
| Matrix chain | O(n³) |
| Bellman-Ford | O(VE) — handles negative edges, detects negative cycles |
| Floyd-Warshall | O(V³) all pairs |
| TSP (Held-Karp) | O(n²·2ⁿ) |
> Matrix chain: cost of multiplying p×q by q×r = p·q·r. Always try both parenthesisations for 3 matrices.

# Graph algorithms
- BFS: shortest paths in unweighted graphs. DFS: topological sort (reverse finish order), cycle detection (back edge), SCC (Kosaraju/Tarjan), articulation points & bridges — all O(V + E).
- Spanning tree has V − 1 edges; Kₙ has n^{n−2} spanning trees.
- Which algorithm? one pair / single source (+ve) → Dijkstra; negative edges → Bellman-Ford; all pairs → Floyd-Warshall; MST → Kruskal/Prim.

# Divide & conquer
Merge sort, quick sort, binary search, Strassen (7 multiplications), Karatsuba, closest pair O(n log n), max-min with 3n/2 − 2 comparisons.

# String matching
Naive O(nm); KMP O(n + m) with LPS array; Rabin-Karp expected O(n + m), worst O(nm); Boyer-Moore sub-linear in practice.

# Complexity classes
- P ⊆ NP. NP-complete = in NP and every NP problem reduces to it. To show X is NP-hard: reduce a known NPC problem **to** X.
- NPC: SAT, 3-SAT, clique, vertex cover, independent set, Hamiltonian cycle, TSP (decision), subset sum, 0/1 knapsack (decision), graph k-colouring (k ≥ 3).
- In P: 2-SAT, shortest paths, MST, max-flow, bipartite matching, primality, linear programming.
`);

ISRO.addNotes('math', 'Discrete & Engineering Maths', `
# Logic
- p → q ≡ ¬p ∨ q ≡ ¬q → ¬p (contrapositive). Converse q → p and inverse ¬p → ¬q are NOT equivalent to it.
- ¬∀x P(x) ≡ ∃x ¬P(x). Number of Boolean functions of n variables = 2^{2ⁿ}.

# Sets, relations, functions (|A| = n)
| Count | Value |
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
- Group theory: Lagrange (subgroup order divides group order); cyclic ⇒ abelian; group of prime order is cyclic.

# Combinatorics
- nPr = n!/(n−r)!, nCr = n!/(r!(n−r)!). Arrangements with repeats: n!/(n₁!n₂!…) — BANANA = 60.
- Non-negative solutions of x₁ + … + x_{r} = n: C(n + r − 1, r − 1).
- Pigeonhole: n items in k boxes → some box has ⌈n/k⌉.
- Derangements: D₁..D₅ = 0, 1, 2, 9, 44.
- Subsets of {1..n} with no two consecutive elements: F(n + 2) (Fibonacci) → n = 12 gives 377.
- Catalan Cₙ: 1, 1, 2, 5, 14, 42, 132 — BST counts, stack permutations, balanced parentheses.

# Graph theory
- Handshaking: Σ deg(v) = 2|E|; number of odd-degree vertices is even.
- Kₙ: n(n−1)/2 edges; K_{m,n}: mn edges. Labelled simple graphs on n vertices: 2^{n(n−1)/2}.
- Tree: n − 1 edges; forest with k trees: n − k edges.
- Planar connected: V − E + F = 2; E ≤ 3V − 6 (E ≤ 2V − 4 if no triangles). K₅ and K₃,₃ are non-planar.
- k-regular graph: E = kV/2.
- Euler circuit ⇔ connected and all degrees even. Euler path ⇔ exactly 0 or 2 odd vertices. Hamiltonian: no simple criterion (NPC).
- Chromatic number: Kₙ → n, bipartite → 2, odd cycle → 3, even cycle → 2, planar ≤ 4, tree → 2.
- Eccentricity of v = max distance from v; radius = min eccentricity; diameter = max eccentricity; girth = length of shortest cycle.

# Linear algebra
- det = 0 if two rows/columns are equal or proportional, or one is a combination of others.
- det(AB) = det A · det B; det(Aᵀ) = det A; det(kA) = kⁿ det A; det(A⁻¹) = 1/det A.
- Rank = number of linearly independent rows. Ax = b: consistent iff rank(A) = rank([A|b]); unique iff that rank = number of unknowns.
- Eigenvalues: Σλ = trace, Πλ = det. Triangular/diagonal: eigenvalues are diagonal entries. A^{k} has eigenvalues λ^{k}; A⁻¹ has 1/λ. Symmetric matrices have real eigenvalues.
- 2×2 shortcut: λ² − (trace)λ + det = 0.

# Probability
- P(A ∪ B) = P(A) + P(B) − P(A ∩ B). Independent: P(A ∩ B) = P(A)·P(B).
- Bayes: P(A|B) = P(B|A)P(A) / P(B).
| Distribution | Type | Mean | Variance |
|---|---|---|---|
| Bernoulli(p) | Discrete | p | p(1−p) |
| Binomial(n, p) | Discrete | np | np(1−p) |
| Poisson(λ) | Discrete | λ | λ |
| Geometric(p) | Discrete | 1/p | (1−p)/p² |
| Uniform(a, b) | Continuous | (a+b)/2 | (b−a)²/12 |
| Exponential(λ) | Continuous | 1/λ | 1/λ² |
| Normal(μ, σ²) | Continuous | μ | σ² |
- Gaussian, Rayleigh, Exponential are continuous; Poisson/Binomial are discrete.

# Calculus
- lim sin x / x = 1; lim (1 − cos x)/x² = 1/2; L'Hôpital for 0/0 and ∞/∞.
- Local max: f′ = 0, f″ < 0. Rolle's and Mean value theorems need continuity on [a, b] and differentiability on (a, b).
- ∫ odd function over [−a, a] = 0 — saves time in triple-integral questions.

# Number theory
- φ(n) = n Π(1 − 1/p). Fermat: a^{p−1} ≡ 1 (mod p). Euler: a^{φ(n)} ≡ 1 (mod n) when gcd(a, n) = 1.
- Modular inverse: find d with e·d ≡ 1 (mod φ) — RSA questions.
`);

ISRO.addNotes('toc', 'Theory of Computation', `
# Finite automata
- DFA, NFA, ε-NFA all accept exactly the regular languages. NFA with n states → DFA with ≤ 2ⁿ states.
- Minimisation: merge indistinguishable states (table filling / Myhill-Nerode). Remove unreachable states first.
- **Minimal DFA sizes you should know instantly:**
| Language over {a,b} | States |
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

# Regular expressions
- (a + b)* = (a*b*)* = (a* + b*)* = (a*b)*a*. (a*b)* + (b*a)* = (a + b)*.
- Arden: R = Q + RP ⇒ R = QP* (if ε ∉ P).
- Closure: regular languages are closed under union, intersection, complement, difference, concatenation, star, reversal, homomorphism, inverse homomorphism, quotient.

# Context-free languages
- CFG ⇔ NPDA. DPDA accepts DCFL ⊂ CFL. Every regular language is a DCFL.
- CFLs closed under: union, concatenation, star, reversal, homomorphism, **intersection with regular**. NOT closed under intersection or complement.
- DCFL closed under complement; not under union, intersection, concatenation.
| Language | Class |
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
- Ambiguous grammar: some string has ≥ 2 parse trees ⇔ ≥ 2 leftmost ⇔ ≥ 2 rightmost derivations. E → E+E | E×E | id is ambiguous ("id+id×id" has exactly 2 trees).
- CNF: A → BC | a; a string of length n takes 2n − 1 steps. GNF: A → aα; n steps.
- Pumping lemma shows a language is NOT regular/CFL; it can never prove regularity.

# Turing machines & decidability
- Chomsky hierarchy: Type 3 regular (FA) ⊂ Type 2 CFL (PDA) ⊂ Type 1 CSL (LBA) ⊂ recursive ⊂ Type 0 RE (TM).
- Recursive (decidable): TM halts on every input. RE: TM halts on members (may loop otherwise).
- Recursive closed under complement; RE not. L and L′ both RE ⇒ L recursive. L RE but not recursive ⇒ L′ not RE.
| Problem | Regular | CFL | CSL | RE |
|---|---|---|---|---|
| Membership | D | D | D | U |
| Emptiness | D | D | U | U |
| Finiteness | D | D | U | U |
| Equivalence | D | U | U | U |
| Ambiguity | — | U | — | — |
(D = decidable, U = undecidable)
- Rice's theorem: any non-trivial property of the language of a TM is undecidable. PCP is undecidable.
- Two-stack PDA = TM; queue automaton = TM; multi-tape/non-deterministic TMs add no power.
`);

ISRO.addNotes('cd', 'Compiler Design', `
# Phases
1. Lexical analysis → tokens (uses regex/DFA; tool: lex/flex)
2. Syntax analysis → parse tree (CFG; tool: yacc/bison)
3. Semantic analysis → type checking, scope (annotated tree)
4. Intermediate code generation → three-address code
5. Code optimisation
6. Target code generation
- Symbol table and error handler interact with all phases. Front end = 1–4 (language dependent); back end = 5–6 (machine dependent).
- Errors: illegal character → lexical; missing ; or unbalanced parentheses → syntax; type mismatch, undeclared variable → semantic.
- Token counting: keywords, identifiers, operators, constants, punctuation each count 1; a whole string literal is 1 token; comments and whitespace are dropped.

# Parsing
## Top-down
- Recursive descent / LL(1): needs no left recursion (A → Aα | β ⇒ A → βA′, A′ → αA′ | ε) and left factoring.
- LL(1) condition: for A → α | β, FIRST(α) ∩ FIRST(β) = ∅, and if α ⇒* ε then FIRST(β) ∩ FOLLOW(A) = ∅.
- LL(1): scan Left-to-right, Leftmost derivation, 1 lookahead.
- FIRST: terminals that can begin a string derived from X (include ε if X ⇒* ε). FOLLOW: terminals that can appear right after A; $ ∈ FOLLOW(start).

## Bottom-up
- Shift-reduce: finds handles, produces the **rightmost derivation in reverse**.
- Power: LR(0) < SLR(1) < LALR(1) < CLR(1). Every LL(1) grammar is LR(1) (not necessarily LALR(1)).
- #states: LR(0) = SLR = LALR ≤ CLR.
- Merging CLR states into LALR can create reduce-reduce conflicts, never new shift-reduce conflicts.
- SLR reduces A → α· on FOLLOW(A); CLR/LALR on the item's lookahead.
- Operator precedence grammar: no ε-productions and no two adjacent non-terminals.
- Ambiguous grammars are neither LL(k) nor LR(k).

# Syntax-directed translation
- Synthesized attributes: from children; inherited: from parent/left siblings.
- S-attributed (only synthesized) → evaluated bottom-up. L-attributed (inherited from left only) → one left-to-right pass. S-attributed ⊂ L-attributed.

# Intermediate code
- Three-address code: x = y op z. Representations: quadruples (op, arg1, arg2, result), triples (no result field, refer by position), indirect triples (list of pointers — easy reordering).
- SSA: every variable assigned once (φ-functions at joins). DAG of a basic block exposes common subexpressions.
- Basic block leaders: first statement, any jump target, statement following a jump.

# Optimisation
| Technique | Example |
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
- Register allocation = graph colouring of the interference graph.

# Runtime
- Activation record: return value, actual parameters, control link (caller's AR), access link (non-local data), saved machine status, locals, temporaries.
- Static allocation cannot support recursion; stack allocation can; heap for dynamic data.
- Cross compiler: runs on host, produces code for target (e.g. on-board processors). Bootstrapping: compiler written in its own language. JIT: compile at run time (JVM, .NET).
`);

ISRO.addNotes('os', 'Operating Systems', `
# Processes and threads
- States: New → Ready → Running → (Waiting → Ready) → Terminated. Running → Ready on preemption. **Waiting → Running is impossible** (must go through Ready).
- PCB: PID, state, PC, registers, scheduling info, memory-management info, open files, accounting.
- fork(): returns 0 in child, child PID in parent, −1 on error. n sequential forks → 2ⁿ processes (2ⁿ − 1 children). exec() replaces the image; wait() reaps children.
- Zombie: terminated, entry still in process table until the parent calls wait(). Orphan: parent exited first, adopted by init.
- Threads share code, data, heap, files; each has its own stack, registers, PC. Models: many-to-one (one blocking call blocks all), one-to-one (Linux, Windows), many-to-many.

# CPU scheduling
- TAT = Completion − Arrival; WT = TAT − Burst; Response = First run − Arrival.
| Algorithm | Preemptive | Notes |
|---|---|---|
| FCFS | No | Convoy effect |
| SJF | No | Optimal avg WT for given set; starvation |
| SRTF | Yes | Preemptive SJF |
| Priority | Either | Starvation → aging |
| Round robin | Yes | Large q → FCFS; small q → overhead |
| MLQ / MLFQ | Yes | Feedback lets processes move between queues |
- Schedulers: long-term (job admission, degree of multiprogramming), medium-term (swapping), short-term (CPU dispatcher; runs most often, must be fast).
- Real-time: Rate Monotonic (shorter period ⇒ higher priority, U ≤ n(2^{1/n} − 1)); EDF (U ≤ 1). Priority inversion → priority inheritance / ceiling protocol (Mars Pathfinder).
> Always draw the Gantt chart. Check whether the CPU is idle at the start (first arrival may be > 0).

# Synchronisation
- Race condition: outcome depends on interleaving. Critical-section requirements: mutual exclusion, progress, bounded waiting.
- Peterson's algorithm (2 processes): flag[i] = true; turn = j; while(flag[j] && turn == j);
- Semaphore S: wait/P decrements (blocks if < 0 in blocking impl.), signal/V increments. Counting semaphore final value = initial − #P + #V.
- Producer-consumer: semaphores empty = N, full = 0, mutex = 1. Producer: wait(empty), wait(mutex) … signal(mutex), signal(full). Wrong order of waits can deadlock.
- Spinlock = busy waiting (fine on multiprocessors, short sections). Monitor: only one process active inside; condition variables.

# Deadlock
- Necessary conditions (all four): mutual exclusion, hold and wait, no preemption, circular wait.
- Prevention breaks a condition (e.g. resource ordering kills circular wait); avoidance = Banker's algorithm (safe state); detection = wait-for graph cycle (single instance).
- RAG with single instances: cycle ⇔ deadlock. Multiple instances: cycle is necessary, not sufficient.
- n processes each needing at most k units: deadlock impossible if R ≥ n(k − 1) + 1.
> Banker's: Need = Max − Allocation. Repeatedly find a process with Need ≤ Available; add its Allocation to Available.

# Memory management
- Contiguous allocation: first fit (fast), best fit (smallest leftover), worst fit, next fit. External fragmentation → compaction or paging.
- Paging: logical address = page number + offset. #pages = 2^{logical bits}/page size. Page table size = #pages × PTE size. Internal fragmentation only (last page).
- Multi-level paging cuts page-table memory; inverted page table has one entry per frame.
- EAT with TLB (hit ratio h, TLB t, memory m): h(t + m) + (1 − h)(t + 2m).
- Segmentation: (segment, offset), segment table has base and limit; external fragmentation. Loader assigns segment numbers.

# Virtual memory
- Demand paging EAT = (1 − p)·m + p·(page-fault service time).
- Replacement: FIFO (Belady's anomaly), Optimal (look ahead, minimum faults), LRU, LFU, clock/second chance (LRU approximation). LRU and OPT are stack algorithms — no Belady's anomaly.
- Thrashing: high paging, low CPU utilisation → reduce multiprogramming, working-set model, page-fault-frequency control.
- Copy-on-write makes fork() cheap. Dirty bit avoids writing clean pages back.

# Disk & files
- Access time = seek + rotational latency (avg = half rotation = 30/RPM s) + transfer.
- Disk scheduling: FCFS, SSTF (starvation), SCAN (elevator, to the end), LOOK (to last request), C-SCAN/C-LOOK (one direction, uniform wait).
- Allocation: contiguous (fast, external fragmentation), linked (no random access; FAT is a table version), indexed (inode).
- UNIX inode: metadata + 12 direct + single + double + triple indirect. Pointers per block = block size / pointer size. File name is in the directory entry, not the inode.
- Hard link → same inode, same file system; soft link → path, can dangle/cross FS.

# Other
- Kernel vs user mode (mode bit); privileged instructions: I/O, timer, interrupt disable, MMU registers.
- Interrupt (async, hardware) vs trap/exception (sync, software — system call, divide by zero, illegal access). Illegal memory access → trap to OS.
- I/O: programmed (polling), interrupt-driven, DMA. Spooling buffers jobs for slow devices.
- Fastest IPC: shared memory. Message passing easier for distributed systems.
`);

ISRO.addNotes('cn', 'Computer Networks', `
# Layering
| OSI | Unit | Devices / protocols |
|---|---|---|
| 7 Application | Data | HTTP, FTP, SMTP, DNS, SNMP |
| 6 Presentation | Data | Encryption, compression, encoding |
| 5 Session | Data | Session control, checkpoints |
| 4 Transport | Segment | TCP, UDP — ports, end-to-end |
| 3 Network | Packet | IP, ICMP, routers, OSPF/RIP/BGP |
| 2 Data link | Frame | Ethernet, switches, bridges, ARP*, PPP |
| 1 Physical | Bit | Hubs, repeaters, cables |
- Wrong default gateway → Layer 3 problem. Switch: each port its own collision domain, one broadcast domain. Router separates broadcast domains.

# Physical layer
- Nyquist (noiseless): C = 2B log₂ L. Shannon (noisy): C = B log₂(1 + SNR); SNR(dB) = 10 log₁₀ SNR.
- Manchester: transition every bit → baud = 2 × bit rate. Fibre is immune to EMI.

# Data link layer
- Error detection: parity (odd # of bit errors), checksum, CRC (degree-r generator appends r bits; detects all bursts ≤ r). Error correction: Hamming, Reed-Solomon, LDPC, convolutional/Turbo.
- Hamming: r parity bits for m data bits: 2^{r} ≥ m + r + 1. Detect d errors → d_min ≥ d + 1; correct d errors → d_min ≥ 2d + 1.
- Bit stuffing: insert 0 after five consecutive 1s (flag 01111110).

## Flow control
- a = Tp / Tt. Stop-and-wait efficiency = 1/(1 + 2a). Window N: min(1, N/(1 + 2a)).
- Sequence numbers with n bits: GBN sender window ≤ 2ⁿ − 1 (receiver 1); Selective Repeat ≤ 2ⁿ⁻¹ each.
- Window needed for full utilisation ≈ 1 + 2a; in bytes ≈ bandwidth × RTT.

## Medium access
- Pure ALOHA max 18.4% (1/2e), slotted ALOHA 36.8% (1/e).
- CSMA/CD (Ethernet): Tt ≥ 2·Tp ⇒ minimum frame = 2 × bandwidth × propagation delay. Backoff after n-th collision: K ∈ [0, 2ⁿ − 1].
- CSMA/CA (Wi-Fi): RTS/CTS, solves hidden terminal.
- Ethernet: frame 64–1518 bytes, payload 46–1500; MAC 48 bits.
- 802.11: b 11 Mbps (2.4 GHz), a/g 54 Mbps, n 600 Mbps, ac ~3.5–6.9 Gbps (5 GHz), ad 7 Gbps (60 GHz), ax (Wi-Fi 6) 9.6 Gbps.

# Network layer
## IPv4 addressing
| Class | First octet | Default mask |
|---|---|---|
| A | 1–126 | /8 |
| B | 128–191 | /16 |
| C | 192–223 | /24 |
| D (multicast) | 224–239 | — |
| E (reserved) | 240–255 | — |
- Private: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16. Loopback 127.0.0.0/8. APIPA 169.254/16.
- /n prefix → 2^{32−n} addresses, 2^{32−n} − 2 usable hosts. Block size in the interesting octet = 256 − mask octet.
> /26 → block 64: .0, .64, .128, .192. 10.0.0.126 and 10.0.0.131 are in different /26 subnets → router needed.
- Network address = IP AND mask; broadcast = network with all host bits 1.

## IP header & fragmentation
- Header 20–60 bytes; total length 16 bits (max 65,535); TTL; protocol (6 TCP, 17 UDP, 1 ICMP); fragment offset in 8-byte units; MF flag.
- Fragment data size must be a multiple of 8 (except the last): MTU 1500 → 1480 data bytes per fragment.
- IPv6: 128-bit, 40-byte fixed header, no checksum, fragmentation only at source, min MTU 1280.

## Routing & support protocols
- Distance vector (RIP, Bellman-Ford, hop limit 15, count-to-infinity → split horizon, poison reverse). Link state (OSPF, Dijkstra, flooding of LSAs). Path vector (BGP between ASes).
- ARP: IP → MAC (broadcast request). RARP: MAC → IP. DHCP: UDP 67/68, DORA. NAT: private ↔ public, PAT uses ports.
- ICMP: echo (ping), time exceeded (traceroute), destination unreachable / fragmentation needed (**Path MTU discovery breaks if ICMP is blocked**).

# Transport layer
- UDP header 8 bytes; TCP header 20–60 bytes.
- TCP: 3-way handshake (SYN, SYN-ACK, ACK); 4-way close; TIME_WAIT = 2·MSL. Flags: SYN, ACK, FIN, RST, PSH, URG.
- Flow control: receiver window (rwnd, 16-bit → 64 KB; window scaling for more). Congestion control: slow start (exponential to ssthresh), congestion avoidance (+1 MSS/RTT), timeout → ssthresh = cwnd/2, cwnd = 1 (Tahoe); 3 dup ACKs → fast retransmit/recovery (Reno: cwnd = ssthresh).
- Sender window = min(cwnd, rwnd). Ideal window = BDP = bandwidth × RTT (e.g. 8,192,000 bps × 32 ms = 32,768 bytes).

# Application layer
| Protocol | Port | Transport |
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
- Satellite: GEO ≈ 36,000 km → one-way up+down ≈ 240 ms, RTT ≈ 480 ms → huge BDP, needs large TCP windows.
`);

ISRO.addNotes('dbms', 'DBMS', `
# ER model → relations
- Strong entity → table. Weak entity → table with owner's key + partial key (discriminator).
- 1:1 → FK on either side (total participation side preferred). **1:N → FK on the N side.** M:N → separate table.
- Multivalued attribute → separate table. Minimum tables for A, B with a 1:N R1 and an M:N R2 → 3.
- ER diagram gives a static view. Three-schema: external / conceptual / internal. Logical data independence is harder than physical.

# Keys
- Superkey ⊇ candidate key (minimal) ⊇ primary key (chosen; not NULL). Alternate key = other candidate keys.
- With n attributes and one candidate key of k attributes: 2^{n−k} superkeys.
- Entity integrity: PK not NULL. Referential integrity: FK matches a PK or is NULL.

# Relational algebra
- Basic: σ (select rows), π (project columns, removes duplicates), ∪, −, × , ρ. Derived: ∩, ⋈, ÷.
- Division R ÷ S: tuples in R associated with **all** tuples of S ("enrolled in all courses").
- |R × S| = |R|·|S|. Natural join with no common attributes = cross product.
- select * from R, S ≡ R CROSS JOIN S.

# SQL essentials
- Logical evaluation: FROM → WHERE → GROUP BY → HAVING → SELECT → DISTINCT → ORDER BY.
- WHERE filters rows, HAVING filters groups. Aggregates ignore NULL except COUNT(*). NULL = NULL is UNKNOWN; use IS NULL.
- DDL: CREATE, ALTER, DROP, TRUNCATE. DML: SELECT, INSERT, UPDATE, DELETE. DCL: GRANT, REVOKE. TCL: COMMIT, ROLLBACK, SAVEPOINT.
- IN / EXISTS subqueries; correlated subquery runs per outer row. BETWEEN is inclusive.
- Views: virtual tables — restrict columns/rows for security; simple views are updatable; materialized views store results.
- Composite index (a, b, c) helps predicates on a, (a, b), (a, b, c) — not on b or c alone.

# Functional dependencies & normalisation
- Armstrong: reflexivity, augmentation, transitivity (sound & complete). Derived: union, decomposition, pseudo-transitivity.
- Find keys with attribute closure: attributes never on any RHS must be in every key.
| NF | Condition (for every non-trivial X → A) |
|---|---|
| 1NF | Atomic values |
| 2NF | No non-prime attribute partially depends on a candidate key |
| 3NF | X is a superkey **or** A is prime |
| BCNF | X is a superkey |
| 4NF | No non-trivial MVD unless X is superkey |
| 5NF | No join dependency not implied by keys |
- Any 2-attribute relation is in BCNF.
- Lossless join: R1 ∩ R2 → R1 or R1 ∩ R2 → R2. Dependency preserving: (F1 ∪ F2)⁺ = F⁺.
- 3NF synthesis: always lossless + dependency preserving. BCNF: always lossless, may lose dependencies.
> 2025 Q48: AB → CD, DE → P, C → E, P → C, B → G. Key AB. B → G is partial ⇒ not even 2NF.

# Transactions
- ACID: Atomicity (all or nothing — undo log), Consistency, Isolation (concurrency control), Durability (committed changes survive any failure — redo log, WAL).
- Conflicting operations: different transactions, same item, at least one write (RW, WR, WW).
- Conflict serializable ⇔ precedence graph acyclic. View serializable ⊇ conflict serializable (difference: blind writes).
- Recoverable: T commits only after every T it read from commits. Cascadeless: read only committed data. Strict: no read/write of uncommitted writes.
- 2PL (growing then shrinking) ⇒ conflict serializable, deadlock possible. Strict 2PL: hold X-locks till commit (no cascading aborts). Rigorous: hold all locks. Conservative: lock all at start (deadlock free).
- Timestamp ordering; Thomas write rule ignores obsolete writes. Wait-die (non-preemptive: older waits, younger dies), wound-wait (preemptive: older wounds younger).
- Isolation levels: read uncommitted (dirty reads) → read committed → repeatable read (phantoms) → serializable.
- Recovery: WAL — log before data. Deferred update → redo only; immediate update → undo + redo. Checkpoints limit log scan.

# Indexing & storage
- Blocking factor bfr = ⌊block size / record size⌋; blocks = ⌈records / bfr⌉. Binary search ≈ ⌈log₂ blocks⌉ accesses.
- Primary index: on ordering key, sparse (one entry per block). Clustering index on ordering non-key. Secondary: dense.
- B+ tree order p: internal node ≤ p pointers; leaves linked for range scans.

# NoSQL
- Flexible schema, horizontal scaling, BASE (Basically Available, Soft state, Eventually consistent).
- Key-value (Redis, DynamoDB), document (MongoDB, BSON), wide-column (Cassandra, HBase), graph (Neo4j).
- CAP: choose two of Consistency, Availability, Partition tolerance (P is mandatory in practice → CP or AP).
`);

ISRO.addNotes('coa', 'Computer Organization & Architecture', `
# Performance
- CPU time = IC × CPI × T_clock = IC × CPI / f. MIPS = f / (CPI × 10⁶).
- Amdahl's law: Speedup = 1 / ((1 − p) + p/s). Upper bound 1/(1 − p).

# Instruction set architecture
| Mode | Operand | Memory refs (operand) |
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
- Zero-address = stack machine; one-address = accumulator.
- RISC: fixed-length instructions, load/store, many registers, hardwired control, pipelining-friendly. CISC: variable length, many modes, microprogrammed.

# Control unit
- Hardwired: fast, hard to modify. Microprogrammed: control memory; horizontal (one bit per signal, wide, parallel) vs vertical (encoded, narrow, needs decoders).
- Micro-operation = elementary operation on register data in one clock (e.g. R1 ← R1 + R2).

# Pipelining
- k stages, n instructions: (k + n − 1) cycles. Speedup = nk / (k + n − 1) → k.
- Clock = max(stage delay) + latch delay. Non-pipelined time = sum of stage delays.
- Hazards: structural (resource conflict), data (RAW true; WAR/WAW false — removed by renaming), control (branches).
- Fixes: forwarding/bypassing, stalls (load-use needs 1), branch prediction, delayed branch, flushing.
- CPI with stalls = 1 + (branch freq × penalty) + ...
- Instruction queue/prefetch buffer is FIFO. Superscalar = multiple issue per cycle (CPI < 1). VLIW = compiler packs parallel ops. Tomasulo = dynamic out-of-order scheduling.

# Memory hierarchy
- Address split: **Tag | Index | Offset**. Offset = log₂(block size). Index = log₂(#lines) for direct-mapped, log₂(#sets) for set-associative, 0 for fully associative.
- Direct-mapped: block j → line j mod m. k-way: #sets = #lines / k.
- AMAT = hit time + miss rate × miss penalty. Two-level: L1 hit + m1 × (L2 hit + m2 × memory).
- Misses: compulsory, capacity, conflict (eliminated by full associativity), coherence.
- Write-through (+ write buffer) vs write-back (dirty bit). Write-allocate vs no-write-allocate.
- Replacement: LRU, FIFO, random.
- SRAM: flip-flops, fast, cache. DRAM: capacitor, refresh, dense, main memory.
- Chips needed = (total words / chip words) × (word width / chip width). 4 GB byte-addressable → 32 address lines.
- Interleaving: consecutive words in different modules → higher bandwidth.

# Computer arithmetic
- n-bit 2's complement: −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1. Overflow: carry into MSB ≠ carry out of MSB.
- 2's complement of x = invert + 1 (or copy up to and including first 1 from right, invert the rest).
- Booth's algorithm: pairs (Qᵢ, Qᵢ₋₁): 10 → subtract, 01 → add, 00/11 → shift. Efficient for runs of 1s.
- **IEEE 754** single: 1 sign | 8 exponent (bias 127) | 23 fraction; value = (−1)ˢ × 1.f × 2^{e−127}. Double: 1 | 11 (bias 1023) | 52.
- Exponent all 0s: zero/denormal; all 1s: ∞ (f = 0) or NaN (f ≠ 0). 1.0 = 0x3F800000.

# I/O and interrupts
- Programmed I/O (polling, wastes CPU), interrupt-driven, DMA (block transfer without CPU; cycle stealing vs burst).
- Vectored interrupt: the device supplies the ISR address/vector. Daisy chaining: serial priority, nearest device highest.
- Memory-mapped I/O (normal load/store) vs isolated I/O (IN/OUT, separate space).
- Endianness: little-endian stores LSB at lowest address (x86); big-endian = network order.

# Parallel architecture
- Flynn: SISD (uniprocessor), SIMD (vector/GPU), MISD (rare), MIMD (multicore, clusters).
- Cache coherence: MESI (Modified, Exclusive, Shared, Invalid); snooping for buses, directories for many cores.
`);

ISRO.addNotes('dl', 'Digital Logic', `
# Number systems & codes
- Binary ↔ octal (groups of 3) ↔ hex (groups of 4). Fraction to binary: repeatedly ×2.
- (0.11101)₂ = 0.5 + 0.25 + 0.125 + 0.03125 = 0.90625.
- Signed: sign-magnitude & 1's complement have two zeros; 2's complement has one zero and range −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1.
- BCD: each decimal digit in 4 bits. Excess-3 = BCD + 3 (self-complementing). Gray: gᵢ = bᵢ ⊕ bᵢ₊₁; adjacent values differ in one bit.

# Boolean algebra
- Absorption: A + AB = A; A(A + B) = A. Redundancy: A + A′B = A + B. Consensus: AB + A′C + BC = AB + A′C.
- De Morgan: (AB)′ = A′ + B′; (A + B)′ = A′B′. Duality: swap +/·, 0/1.
- XOR: A ⊕ B = A′B + AB′; A ⊕ A = 0; A ⊕ 1 = A′; XNOR = equivalence.
- NAND/NOR are universal. Gate counts with 2-input NAND: NOT 1, AND 2, OR 3, XOR 4, XNOR 5. With NOR: NOT 1, OR 2, AND 3, XNOR 4, XOR 5.
- NAND/NOR with inputs tied = NOT. NAND of inverted inputs = OR.
- n variables: 2ⁿ minterms, 2^{2ⁿ} functions.

# K-maps
- Groups of 1, 2, 4, 8 … cells (wrap-around). Group of 2ᵏ eliminates k variables.
- Prime implicant: largest possible group. Essential: covers a minterm nothing else covers.
- Don't cares (X) may be treated as 1 or 0 to enlarge groups.
- Static-1 hazard: add the consensus term.

# Combinational circuits
- Half adder: S = A ⊕ B, C = AB. Full adder: S = A ⊕ B ⊕ Cᵢₙ, Cₒᵤₜ = AB + Cᵢₙ(A ⊕ B); 3 inputs, 2 outputs; FA = 2 HA + OR.
- Ripple carry delay ∝ n. Carry look-ahead: Gᵢ = AᵢBᵢ, Pᵢ = Aᵢ ⊕ Bᵢ, Cᵢ₊₁ = Gᵢ + PᵢCᵢ.
- MUX 2ⁿ:1 has n select lines; can implement any function of n + 1 variables. 16:1 from 4:1 needs 5.
- DEMUX 1:2ⁿ has n select lines (1-16 demux → 4).
- Decoder n → 2ⁿ (+ OR gates = any function). 1-of-32 from 3:8 decoders → 4 (+ a 2:4 for enables).
- Encoder 2ⁿ → n (octal-to-binary uses 3 OR gates); priority encoder resolves multiple inputs.
- Comparator: (A > B) = AB′, (A = B) = (A ⊕ B)′.

# Sequential circuits
| FF | Characteristic equation | Notes |
|---|---|---|
| SR | Q⁺ = S + R′Q (SR = 0) | S = R = 1 invalid |
| JK | Q⁺ = JQ′ + K′Q | J = K = 1 toggles |
| D | Q⁺ = D | Delay / latch |
| T | Q⁺ = T ⊕ Q | Toggle |
- Gated D latch: transparent while enable/clock HIGH, holds when LOW. Edge-triggered FF samples on the edge.
- Race-around: level-triggered JK with J = K = 1 and long pulse → fix with master-slave or edge triggering.
- Counters: MOD-N needs ⌈log₂ N⌉ flip-flops. Ripple (asynchronous): f_max = 1/(n·t_pd); each stage divides frequency by 2. Synchronous: all FFs share clock.
- Ring counter: n FFs → n states. Johnson counter: 2n states.
- Shift registers: SISO, SIPO, PISO, PIPO. n-bit serial delay = n × clock period (8 bits at 400 MHz → 20 ns).
- Mealy (output = f(state, input)) usually needs fewer states than Moore (output = f(state)).

# Logic families
- CMOS: lowest static power, high noise margin. TTL: classic, fan-out ~10. ECL: fastest (non-saturating), most power.
- Fan-in = number of inputs; fan-out = number of gate inputs one output can drive; propagation delay; noise margin.
`);

ISRO.addNotes('prog', 'Programming & OOP', `
# C essentials
- sizeof(char) = 1 always. Typical 64-bit: int 4, long 8, pointer 8, float 4, double 8.
- Struct padding aligns members (struct {char; int;} = 8). Union size = largest member (+ padding).
- sizeof("ISRO") = 5 (includes \\0); strlen = 4.
- Integer division truncates toward zero (C99): −7/3 = −2, −7 % 3 = −1. % sign follows the dividend.
- Modifying a variable twice without a sequence point (i++ + ++i, a[i] = i++) is **undefined behaviour**.
- Short circuit: in A && B, B is not evaluated if A is false; in A || B, B is skipped if A is true.
- if (a = 5) is assignment (always true). switch cases fall through until break.
- for (…); with a stray semicolon has an empty body.

# Pointers
- p + k advances by k × sizeof(*p): int* (2-byte) 200 + 3 → 206.
- int *p[10] → array of 10 pointers; int (*p)[10] → pointer to array; int (*f)(int) → pointer to function; int *f(int) → function returning int*.
- *(a + i) ≡ a[i] ≡ i[a]. Arrays decay to pointers when passed to functions.
- NULL dereference, out-of-bounds access, use-after-free, double free → undefined behaviour. Leak = allocated memory lost without free.
- Dangling pointer: points to freed/expired memory. Wild pointer: never initialised.
- malloc (uninitialised), calloc(n, size) (zeroed), realloc, free.

# Storage classes & keywords
| Class | Scope | Lifetime | Default |
|---|---|---|---|
| auto | Block | Block | Garbage |
| register | Block | Block | Garbage (no &) |
| static (local) | Block | Program | 0 |
| static (global) | File | Program | 0 |
| extern | Global | Program | 0 |
- const: read-only. volatile: value may change outside program flow (hardware registers, ISR flags) — compiler must re-read every time. Crucial for on-board embedded code.
- Macros are textual: #define SQ(x) x*x → SQ(2+3) = 11. Use ((x)*(x)).

# Bit tricks
- x & (x − 1) clears lowest set bit; = 0 iff x is a power of 2.
- x & −x isolates the lowest set bit. x << k = x·2ᵏ; x >> k = x/2ᵏ (unsigned).
- Swap without temp: a ^= b; b ^= a; a ^= b.

# Recursion tracing
- Write the call tree; count calls. f(n) = n % 10 + f(n/10) sums digits; f(n) = n·f(n−1) factorial; fib recursive calls = 2F(n+1) − 1.

# OOP (C++ / Java)
- Encapsulation, abstraction, inheritance, polymorphism.
- Compile-time polymorphism: function/operator overloading, templates. Run-time: virtual functions (vtable + vptr).
- Pure virtual (= 0) ⇒ abstract class. Make base destructors virtual.
- C++ class default private; struct default public. friend functions access private members.
- Copy constructor: pass/return by value, initialise from another object. Shallow vs deep copy.
- Diamond problem → virtual inheritance (C++); Java allows multiple inheritance only through interfaces.
- Java: final (no override / no extend / constant), static, abstract, interface; objects on heap, GC; Strings immutable; checked exceptions must be caught or declared.
- JVM: bytecode is platform independent; JIT compiles hot code.

# Python quick hits
- / gives float, // floor division, ** power. Lists mutable, tuples/strings immutable. [1,2]*2 = [1,2,1,2].

# Language concepts
- Parameter passing: value, reference, value-result, name. C is call-by-value (pointers simulate reference).
- Static (lexical) scoping: C, C++, Java, Python. Dynamic scoping: early Lisp, bash variables.
`);

ISRO.addNotes('se', 'Software Engineering', `
# Process models
| Model | Use when | Key idea |
|---|---|---|
| Waterfall | Requirements stable | Sequential phases |
| V-model | Safety-critical | Each dev phase has a test phase |
| Prototyping | Requirements unclear | Throwaway/evolutionary prototype |
| Incremental / iterative | Early partial delivery | Build in increments |
| Spiral (Boehm) | Large, risky projects | Risk analysis in every loop |
| RAD | Tight time, modular | Component reuse |
| Agile / Scrum | Changing requirements | Sprints, backlog, daily stand-up |
- V-model pairs: requirements ↔ acceptance test; system design ↔ system test; architecture ↔ integration test; module design ↔ unit test.
- CMM levels: 1 Initial, 2 Repeatable, 3 Defined, 4 Managed, 5 Optimizing.

# Requirements
- SRS (IEEE 830): correct, unambiguous, complete, consistent, ranked, verifiable, modifiable, traceable.
- Functional (what) vs non-functional (performance, reliability, safety, security, usability).

# Estimation
- LOC, Function Points: UFP = Σ count × weight over EI, EO, EQ, ILF, EIF. FP = UFP × (0.65 + 0.01 × ΣFᵢ) with 14 factors rated 0–5.
> 2025: UFP 578, all factors 3 → CAF = 0.65 + 0.42 = 1.07 → FP = 618.46.
- Basic COCOMO: Effort = a·KLOC^{b}, Time = c·Effort^{d}.
| Mode | a | b | c | d |
|---|---|---|---|---|
| Organic | 2.4 | 1.05 | 2.5 | 0.38 |
| Semi-detached | 3.0 | 1.12 | 2.5 | 0.35 |
| Embedded | 3.6 | 1.20 | 2.5 | 0.32 |
- PERT: expected time = (o + 4m + p)/6, σ = (p − o)/6. CPM: critical path = longest path, zero slack.
- Risk management: identification → analysis → planning → monitoring.

# Design
- Aim for **low coupling, high cohesion**.
- Cohesion (worst → best): coincidental, logical, temporal, procedural, communicational, sequential, functional.
- Coupling (best → worst): data, stamp, control, external, common, content.
- Fan-in = callers of X (high fan-in ⇒ tightly coupled, changes ripple). Fan-out = functions X calls (high ⇒ X complex).
- Cyclomatic complexity V(G) = E − N + 2P = (decision points) + 1 = number of regions (planar CFG). It bounds the number of basis-path test cases — white-box.
- Halstead: n₁, n₂ distinct operators/operands; N₁, N₂ totals; volume V = N log₂ n.
- Modelling: DFD (functional; level 0 = context diagram), ER (static data), state charts (dynamic), structure chart, HIPO (Hierarchy + Input-Process-Output).
- UML: structural — class, object, component, deployment, package; behavioural — use case, activity, state machine, sequence, communication, timing. Composition = filled diamond, aggregation = hollow diamond, inheritance = hollow triangle.
- Patterns: Singleton, Factory, Observer, Adapter, Decorator, MVC.

# Testing
- Verification: building the product right (reviews, inspections). Validation: building the right product (testing against user needs).
- Levels: unit → integration (top-down uses stubs; bottom-up uses drivers; big-bang; sandwich) → system → acceptance (alpha at developer site, beta at user site).
- Black box: equivalence partitioning, boundary value analysis (min−1, min, min+1, max−1, max, max+1), decision tables, cause-effect graphs, state transitions.
- White box coverage (weak → strong): statement < branch/decision < condition < condition/decision < **MC/DC** < multiple-condition. MC/DC = Modified Condition/Decision Coverage, required by DO-178C Level A avionics software.
- Regression testing: re-test after changes. Smoke: build verification. Sanity: narrow check after a fix. Stress: beyond limits. Load: expected peak. Mutation: seed faults to grade the test suite.

# Maintenance & reliability
- Corrective (bugs), adaptive (new environment), perfective (enhancements), preventive (refactoring).
- MTBF = MTTF + MTTR; availability = MTTF / MTBF. ROCOF, POFOD are reliability metrics.
- Configuration management: baselines, version control, change control board.
`);

ISRO.addNotes('sec', 'Information Security', `
# Security goals (X.800 services)
| Service | Meaning |
|---|---|
| Confidentiality | Protection from unauthorised disclosure |
| Integrity | Data arrives exactly as sent |
| Availability | Accessible when needed (DoS attacks this) |
| Authentication | Proving identity |
| Non-repudiation | Sender cannot deny having participated |
| Access control | Preventing unauthorised use of a resource |

# Symmetric cryptography
- Same key both sides; n users need n(n−1)/2 keys (16 users → 120). Public key needs 2n keys (n pairs).
- DES: 64-bit block, 56-bit key, 16 Feistel rounds (broken by brute force). 3DES: 112/168-bit effective. AES (Rijndael): 128-bit block, keys 128/192/256 → 10/12/14 rounds, SPN.
- An n-bit key → 2ⁿ possible keys.
- Modes: ECB (identical blocks → identical ciphertext, avoid), CBC (IV, chaining), CFB/OFB/CTR (stream-like), GCM (authenticated encryption).
- Classical: Caesar (shift), monoalphabetic substitution, Vigenère (polyalphabetic), Playfair, Hill, rail-fence/columnar (transposition). One-time pad: perfect secrecy.

# Public-key cryptography
- RSA: choose p, q; n = pq; φ = (p−1)(q−1); pick e coprime to φ; d = e⁻¹ mod φ. Encrypt c = mᵉ mod n, decrypt m = cᵈ mod n. Security: factoring.
> p = 11, q = 13 → φ = 120; d = 7 ⇒ e = 103 since 7 × 103 = 721 = 6 × 120 + 1.
- Diffie-Hellman: A = gᵃ mod p, B = gᵇ mod p, shared key gᵃᵇ mod p. Discrete log hardness; vulnerable to MITM without authentication.
- ECC: same security with much shorter keys (256-bit ECC ≈ 3072-bit RSA).
- Confidentiality → encrypt with receiver's public key. Signature → sign with sender's private key, verify with sender's public key.
- Asymmetric crypto provides confidentiality, authentication, key exchange — not DoS protection.

# Hashes & MACs
- Hash: fixed output, one-way, collision resistant; **no key** (message digest). MD5 128-bit, SHA-1 160-bit (both broken), SHA-256, SHA-3.
- Birthday attack: ~2^{n/2} work for an n-bit hash.
- MAC/HMAC: keyed hash → integrity + authentication (not non-repudiation). Digital signature adds non-repudiation.

# PKI & protocols
- X.509 certificates signed by a CA; revocation via CRL/OCSP. (X.25 is an old WAN standard!)
- TLS: handshake (asymmetric: authenticate + key exchange) → symmetric session keys. HTTPS = HTTP over TLS (443).
- IPsec: AH = integrity + authentication (no encryption). ESP = encryption (+ optional integrity). Transport mode protects payload; **tunnel mode encrypts the whole original packet, hiding internal IPs** (site-to-site VPN).
- SSH/SFTP encrypt; SNMPv3 encrypts; DNSSEC only signs (no confidentiality).
- Kerberos: KDC (AS + TGS), tickets, symmetric keys, timestamps.

# Network defence
- Firewalls: packet filter (L3/L4), stateful (tracks connections), application proxy (L7), circuit-level gateway. Firewalls stop network scanning, not physical attacks.
- Ingress filtering blocks malicious incoming traffic; egress filtering stops data leakage. NAT hides internal hosts. DMZ hosts public servers.
- IDS (detects, alerts) vs IPS (inline, blocks); signature vs anomaly based. Honeypots lure attackers.
- VPN: encrypted tunnel over public network.

# Attacks
| Attack | Notes |
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
- Malware: virus (needs host), worm (self-propagating), trojan (disguised), ransomware, rootkit (hides), logic bomb, spyware, keylogger.
- Physical/social: dumpster diving, shoulder surfing, tailgating, pretexting — firewalls can't help.

# Access control models
- DAC (owner decides), MAC (labels/clearances — Bell-LaPadula confidentiality: no read up, no write down; Biba integrity: no read down, no write up), RBAC (roles), ABAC (attributes).
- MFA: something you know + have + are.
`);

ISRO.addNotes('ai', 'AI & Machine Learning', `
# Agents
- PEAS: Performance, Environment, Actuators, Sensors.
- Agent types: simple reflex, model-based reflex, goal-based, utility-based, learning agents. ("Unity based" is not one.)
- Environment properties: observable, deterministic, episodic, static, discrete, single/multi-agent.

# Search
| Algorithm | Complete | Optimal | Time | Space |
|---|---|---|---|---|
| BFS | Yes | Yes (unit costs) | b^{d} | b^{d} |
| Uniform cost | Yes | Yes | — | — |
| DFS | No (infinite) | No | b^{m} | bm |
| Depth-limited | No | No | b^{l} | bl |
| IDDFS | Yes | Yes (unit) | b^{d} | bd |
| Greedy best-first | No | No | — | — |
| A* | Yes | Yes if h admissible | — | — |
- A*: f(n) = g(n) + h(n). Admissible: h never overestimates. Consistent: h(n) ≤ c(n, n′) + h(n′).
- Local search: hill climbing (local maxima, plateaus, ridges), random restart, simulated annealing (accept worse with prob e^{−ΔE/T}), local beam, genetic algorithms (selection, crossover, mutation).
- Games: minimax; alpha-beta prunes branches, best case O(b^{d/2}).
- CSP: backtracking + MRV + degree heuristic + least-constraining value + forward checking / arc consistency (AC-3).

# Knowledge & reasoning
- Propositional and first-order logic. FOL connectives: ¬ ∧ ∨ ⇒ ⇔; quantifiers ∀ ∃.
- Inference: modus ponens, modus tollens, resolution (needs CNF), unification.
- Forward chaining = data-driven; backward chaining = goal-driven (Prolog).
- Uncertainty: Bayes rule; Bayesian networks (DAG + CPTs; hybrid = discrete + continuous variables); HMMs; fuzzy logic (membership ∈ [0, 1]).

# Machine learning
- Supervised (labelled data): regression, classification. Unsupervised: clustering, dimensionality reduction. Reinforcement: agent learns from rewards (Q-learning, SARSA, DQN, policy gradients).
| Algorithm | Type |
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
- Metrics: accuracy = (TP + TN)/total; precision = TP/(TP + FP); recall = TP/(TP + FN); F1 = 2PR/(P + R).
- Entropy H = −Σ pᵢ log₂ pᵢ (50/50 → 1 bit). Information gain = parent entropy − weighted child entropy.

# Neural networks
- Perceptron learns only linearly separable functions (no XOR). MLP with hidden layer can.
- Activations: sigmoid (0, 1), tanh (−1, 1), ReLU max(0, x), softmax (probabilities).
- Backpropagation = chain rule + gradient descent. Vanishing gradients with sigmoid/tanh in deep nets.
- CNN → images; RNN/LSTM/GRU → sequences; Transformers (attention) → language models.

# Uses of AI (ISRO flavoured)
Trend analysis, cyber-incident analysis, pattern recognition in satellite imagery, anomaly detection in telemetry, autonomous navigation.
`);

ISRO.addNotes('cloud', 'Cloud, Big Data & Virtualization', `
# Cloud computing
- NIST essential characteristics: on-demand self-service, broad network access, resource pooling (multi-tenancy), rapid elasticity, measured service.
- **Elasticity** = scale resources up and down automatically with load. Scalability = ability to grow.
| Service model | You manage | Examples |
|---|---|---|
| IaaS | OS, runtime, apps, data | AWS EC2, Azure VMs, OpenStack |
| PaaS | Apps, data | Google App Engine, Heroku |
| SaaS | Just use it | Gmail, Office 365, Salesforce |
| FaaS / serverless | Functions | AWS Lambda, Azure Functions |
- Deployment: public, private (single organisation, on/off premises), community, hybrid. **Cloud bursting**: overflow from private to public at peak.
- Horizontal scaling (scale out, more machines) vs vertical (scale up, bigger machine).
- SLA: guaranteed uptime etc. (99.9% ≈ 8.76 h/year downtime; 99.99% ≈ 52.6 min).
- Edge / fog computing: process near the data source — low latency.

# Virtualization
- Hypervisor (VMM) runs multiple VMs (multiple OS simultaneously). Dual boot runs only one at a time.
- **Type-1 (bare metal)**: runs directly on hardware — VMware ESXi, Xen, Microsoft Hyper-V, KVM. **Type-2 (hosted)**: runs on a host OS — VirtualBox, VMware Workstation.
- Full virtualization: unmodified guest (binary translation or hardware assist). **Para-virtualization**: guest OS is modified to make hypercalls (Xen). Hardware-assisted: Intel VT-x, AMD-V.
- Containers (Docker) share the host kernel (namespaces + cgroups) — lighter than VMs. Kubernetes orchestrates containers.
- Live migration moves a running VM between hosts.

# Big Data
- 5 Vs: Volume, Velocity, Variety, Veracity, Value (Visualisation is not one of the core Vs).
- Structured (fixed schema tables) / semi-structured (XML, JSON) / unstructured (text, images, video).
- **Hadoop**: HDFS (NameNode = metadata master, DataNodes store blocks; default 128 MB blocks, replication 3; write-once-read-many; good for high-throughput batch, **bad for low latency and multiple concurrent writers**), MapReduce (map → shuffle & sort → reduce), YARN (resource management).
- Ecosystem: Hive (SQL-like), Pig (data flow), HBase (column store on HDFS), Sqoop (RDBMS import), Flume (log ingest), ZooKeeper (coordination), Oozie (workflows).
- Spark: in-memory, RDD/DataFrames, much faster for iterative jobs. **Stream processing**: Apache Flink, Storm, Spark Streaming, Kafka Streams. Kafka = distributed event log / pub-sub.
- NoSQL for unstructured data: Cassandra (distributed, peer-to-peer, AP), MongoDB (documents), HBase, Redis, Neo4j.
- CAP theorem, eventual consistency, consistent hashing for partitioning.

# Misc tools
- JMX = Java Management Extensions (monitor/manage Java apps via MBeans).
- Splunk = log analytics/SIEM; ERDPlus = ER diagram tool (not big data processing).
`);

ISRO.addNotes('apt', 'Aptitude & Reasoning', `
# Part B facts
- 15 questions, 20 marks, **no negative marking** — answer everything.
- Types seen: figure series/odd one out, seating arrangement, syllogism, statement–conclusion, course of action, number series, data interpretation (table/graph), calendar, mensuration, mixtures, situational judgement.

# Quantitative shortcuts
- Percent change = (new − old)/old × 100. Successive changes a% and b%: a + b + ab/100.
- Profit% on cost; marked price with discount: SP = MP(1 − d). Mark up 20%, discount 10% → +8%.
- SI = PRT/100. CI amount = P(1 + r/100)ⁿ. Sum doubles in n years at SI → rate = 100/n %.
- Work: A in a days, B in b days → together ab/(a + b). Pipes: filling positive, emptying negative.
- Speed: km/h × 5/18 = m/s. Average speed for equal distances = 2xy/(x + y). Boat: stream = (down − up)/2.
- Trains: time to pass a pole = length/speed; a platform = (train + platform)/speed.
- Mixtures: keep one component fixed and change the other (sugar 15 : salt 30 → add 45 sugar for 2 : 1).
- Max area for fixed perimeter → square. Scaling lengths by k scales area by k², volume by k³.
- Ages, ratios: split totals in ratio parts.

# Series
- Check differences, then differences of differences, then ratios, then ×n + n / ×n − n / squares ± k / primes.
> 7, 8, 18, 57, 228, 1165 — rule ×1+1, ×2+2, ×3+3, ×4+4 → 228 should be 232.

# Calendar & clocks
- Odd days: normal year 1, leap year 2; 100 years 5, 200 years 3, 300 years 1, 400 years 0. Day codes: 0 Sun … 6 Sat.
- Leap year: divisible by 4 and (not by 100 unless by 400).
- Clock angle = |30H − 5.5M|. Hands coincide 22 times a day; straight line 44 times; right angle 44 times.
- Mirror image time = 11:60 − given time (for times after 1:00).

# Logical reasoning
- Syllogisms: draw Venn diagrams; "some A are B" ⇒ "some B are A". A conclusion must hold in **every** diagram. Complementary pair (Some + No on the same terms) → "either I or II follows".
- Fact questions: accept only what must be true — "None of the statements is a known fact" is often right.
- Course of action: must be practical, solve/reduce the problem, not extreme (no "suspend everyone", "ban everything").
- Assumptions underestimating/overestimating: think about who would misreport in the survey.
- Seating: fix one person, draw the circle/square; corners face centre, mid-sides face out → directions flip.
- Directions: track net N–S and E–W; distance by Pythagoras.
- Blood relations: draw a family tree, use symbols for gender.

# Situational judgement
- Choose the response that is honest, communicates with the right person (manager), and keeps work commitments — never deceive or abandon duty.
`);

ISRO.addNotes('formulas', 'Last-day formula sheet', `
# Numbers you must not get wrong
| Topic | Formula |
|---|---|
| Pipeline time | (k + n − 1) cycles; speedup → k |
| Amdahl | 1 / ((1 − p) + p/s) |
| AMAT | hit + miss rate × penalty |
| Cache bits | tag = addr − index − offset |
| EAT (TLB) | h(t + m) + (1 − h)(t + 2m) |
| EAT (page faults) | (1 − p)m + p·service |
| Page table size | (2^{VA}/page size) × PTE |
| Deadlock-free | R ≥ n(k − 1) + 1 |
| fork() n times | 2ⁿ processes |
| Stop-and-wait | 1/(1 + 2a), a = Tp/Tt |
| GBN / SR window | 2ⁿ − 1 / 2ⁿ⁻¹ |
| CSMA/CD | L_min = 2 × B × Tp |
| ALOHA | 18.4% / slotted 36.8% |
| Nyquist / Shannon | 2B log₂L / B log₂(1 + S/N) |
| Hosts in /n | 2^{32−n} − 2 |
| BDP window | bandwidth × RTT |
| Hamming bits | 2^{r} ≥ m + r + 1 |
| Error detect / correct | d + 1 / 2d + 1 |
| Cyclomatic | E − N + 2P |
| FP | UFP × (0.65 + 0.01 ΣF) |
| PERT | (o + 4m + p)/6 |
| Availability | MTTF / (MTTF + MTTR) |
| RSA | ed ≡ 1 mod (p−1)(q−1) |
| Symmetric keys | n(n − 1)/2 |
| Euler planar | V − E + F = 2 |
| Planar bound | E ≤ 3V − 6 |
| Handshake | Σ deg = 2E |
| Spanning trees Kₙ | n^{n−2} |
| Catalan | C(2n, n)/(n + 1) |
| Binary tree | n₀ = n₂ + 1 |
| Heap children | 2i, 2i + 1 |
| AVL min nodes | N(h) = N(h−1) + N(h−2) + 1 |
| IEEE 754 single | 1 / 8 (bias 127) / 23 |
| 2's complement range | −2ⁿ⁻¹ … 2ⁿ⁻¹ − 1 |
| Relations on n-set | 2^{n²} |
| Boolean functions | 2^{2ⁿ} |
| Minimal DFA nth from right | 2ⁿ |
| CNF derivation steps | 2n − 1 |

# Repeated-pattern answers
- S → aSb | T, T → bT | b ⇒ aᵐbⁿ, m < n.
- (a*b)* + (b*a)* = (a + b)*.
- Ambiguous E → E+E | E×E | id: "id+id×id" has exactly 2 parse trees.
- Durability holds "always, even if there is failure of any kind".
- Trap = software interrupt. Linux threads = one-to-one. Loader assigns segment numbers.
- Para-virtualization modifies the guest OS. Type-1 = bare metal.
- DNSSEC doesn't encrypt; IPsec ESP tunnel hides private IPs; blocking ICMP breaks PMTU discovery.
- MC/DC = Modified Condition/Decision Coverage. CMM: Initial, Repeatable, Defined, Managed, Optimizing.
- Message digest uses no key. X.509 = PKI certificates. CAPTCHA → automated attacks. Ping of death → buffer overflow.
`);
