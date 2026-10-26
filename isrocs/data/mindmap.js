/* Mind map: 2-space indentation = depth. "[key] Title" on top-level lines ties a branch to a subject.
   "Title :: note" puts a one-line fact under the node. Leaves get a "mastered" tick. */
ISRO.setMindmap(`
[ds] Data Structures
  Arrays & Strings
    Address calculation :: Row-major A[i][j] = B + (i·C + j)·w ; column-major = B + (j·R + i)·w (adjust for lower bounds)
    Triangular / sparse matrices :: Lower triangle has n(n+1)/2 elements; sparse → triplet/CSR form
    Substrings :: m(m+1)/2 non-empty substrings; 2^m subsequences
  Stack
    Applications :: Function calls, recursion, undo, balanced parentheses, DFS, expression evaluation
    Infix → Postfix / Prefix :: Operator stack by precedence; ^ is right-associative
    Evaluate postfix / prefix :: Postfix: scan left→right; Prefix: scan right→left
    Stack permutations :: n inputs → Catalan Cₙ = C(2n,n)/(n+1) valid output orders
  Queue
    Circular queue :: Full when (rear+1)%n == front; empty when front == rear
    Deque & priority queue :: Deque: both ends; PQ via binary heap: insert/delete O(log n)
    Queue via 2 stacks :: Amortised O(1); stack via 2 queues also possible
  Linked List
    Singly / doubly / circular :: Insert at head O(1); search O(n); no random access
    Classic tricks :: Reverse with 3 pointers; Floyd cycle detection; middle via fast/slow
  Trees
    Binary tree facts :: Max nodes at height h = 2^(h+1) − 1 ; n₀ = n₂ + 1 ; NULL links = n + 1
    Traversals :: In/Pre/Post (DFS), level order (BFS). Inorder + pre/post ⇒ unique tree
    Counting trees :: Unlabelled shapes = Catalan Cₙ (1,2,5,14,42); labelled = n!·Cₙ
    BST :: Inorder sorted; search/insert O(h) → O(n) worst; delete: replace with inorder successor
    AVL :: |balance| ≤ 1; rotations LL, RR, LR, RL; min nodes N(h) = N(h−1)+N(h−2)+1
    Red-black :: Height ≤ 2 log(n+1); used in C++ map, Java TreeMap, Linux CFS
    B / B+ trees :: Order m: ≥ ⌈m/2⌉ children; B+ keeps data in linked leaves → range queries
    Heap :: Array 1-based: children 2i, 2i+1; build O(n); insert/delete O(log n); max of min-heap in leaves
    Trie & Union-Find :: Trie search O(L); DSU with rank + path compression ≈ O(α(n))
  Hashing
    Hash functions :: Division (k mod m, m prime), multiplication, universal hashing
    Chaining :: Handles α > 1; unsuccessful search Θ(1 + α)
    Open addressing :: Linear (primary clustering), quadratic (secondary), double hashing; α ≤ 1
  Graph representation
    Adjacency matrix :: O(V²) space, O(1) edge test — dense graphs
    Adjacency list :: O(V + E) space — sparse graphs; BFS/DFS O(V + E)
[algo] Algorithms
  Asymptotics
    Notation :: O upper, Ω lower, Θ tight; o / ω strict
    Growth order :: 1 < log n < √n < n < n log n < n² < n³ < n^(log n) < 2ⁿ < n! < nⁿ
    Useful sums :: Σi = n(n+1)/2 ; Σ1/i ≈ ln n ; log n! = Θ(n log n)
  Recurrences
    Master theorem :: T(n) = aT(n/b) + f(n): compare f(n) with n^(log_b a)
    Standard results :: 2T(n/2)+n → n log n ; T(n/2)+1 → log n ; T(n−1)+n → n² ; 2T(n−1)+1 → 2ⁿ ; T(√n)+1 → log log n
  Sorting
    Comparison bounds :: Lower bound Ω(n log n); merge/heap always n log n
    Quick sort :: Avg n log n, worst n² (sorted + bad pivot), in-place, unstable
    Merge sort :: n log n always, O(n) extra, stable; best for linked lists / external sorting
    Heap sort :: n log n, in-place, unstable
    Insertion / bubble / selection :: n²; insertion best case O(n); selection min swaps (n − 1)
    Non-comparison :: Counting O(n + k), radix O(d(n + k)), bucket avg O(n)
    Stability :: Stable: merge, insertion, bubble, counting, radix. Unstable: quick, heap, selection
  Searching & selection
    Binary search :: ⌊log₂ n⌋ + 1 comparisons max; needs sorted + random access
    Order statistics :: Quickselect avg O(n); median-of-medians worst O(n)
  Greedy
    Principle :: Local optimum each step; needs greedy-choice property + optimal substructure
    Huffman :: Merge two least frequent; prefix-free codes; O(n log n)
    Fractional knapsack & activity selection :: Sort by value/weight; pick earliest finish
    MST :: Kruskal O(E log E) with DSU; Prim O(E log V) heap / O(V²) matrix; V − 1 edges
    Dijkstra :: Single source, non-negative weights; O((V+E) log V)
  Dynamic programming
    Principle :: Overlapping subproblems + optimal substructure; memo / tabulation
    Classic problems :: 0/1 knapsack O(nW), LCS O(mn), matrix chain O(n³), edit distance O(mn)
    Shortest paths :: Bellman-Ford O(VE) (neg edges, detects neg cycles); Floyd-Warshall O(V³) all-pairs
  Divide & conquer
    Examples :: Merge/quick sort, binary search, Strassen (7 mults → n^2.81), Karatsuba (n^1.58), closest pair
  Graph algorithms
    BFS / DFS :: O(V + E); BFS = shortest path unweighted; DFS edges: tree, back, forward, cross
    Topological sort :: DAG only; DFS finish order reversed or Kahn’s in-degree queue
    SCC / bridges / articulation points :: Kosaraju, Tarjan — all O(V + E)
    Spanning tree counts :: Kₙ has n^(n−2) spanning trees (Cayley)
  String matching
    Algorithms :: Naive O(nm); KMP O(n + m) with LPS array; Rabin-Karp rolling hash; Boyer-Moore
  Complexity classes
    P, NP, NP-complete, NP-hard :: NPC = in NP and NP-hard; reduce known-NPC → new problem
    Famous NPC problems :: SAT, 3-SAT, clique, vertex cover, Hamiltonian cycle, TSP(decision), subset sum, graph colouring
    In P :: 2-SAT, shortest path, MST, matching, primality (AKS)
[math] Discrete & Engineering Maths
  Logic
    Equivalences :: p→q ≡ ¬p∨q ≡ ¬q→¬p ; De Morgan ; ¬∀x P ≡ ∃x ¬P
    Counting functions :: 2^(2ⁿ) Boolean functions of n variables; truth table 2ⁿ rows
  Sets, relations, functions
    Relations on n-set :: Total 2^(n²); reflexive 2^(n²−n); symmetric 2^(n(n+1)/2); antisymmetric 2ⁿ·3^(n(n−1)/2)
    Equivalence & partial order :: Equivalence = RST (count = Bell number); POSET = R, antisymmetric, T
    Functions A→B (|A|=m, |B|=n) :: Total nᵐ; one-one nPm; onto via inclusion–exclusion
    Lattices & groups :: Lagrange: subgroup order divides group order; cyclic ⇒ abelian
  Combinatorics
    Permutations & combinations :: nPr, nCr, multiset n!/(n₁!n₂!…); stars & bars C(n+r−1, r−1)
    Pigeonhole & inclusion–exclusion :: ⌈n/k⌉ ; |A∪B∪C| formula ; derangements Dₙ ≈ n!/e
    Recurrences :: Fibonacci; no-two-consecutive subsets of n → F(n+2); Catalan numbers
  Graph theory
    Basics :: Σdeg = 2E; #odd-degree vertices even; complete graph n(n−1)/2 edges
    Planar graphs :: V − E + F = 2; E ≤ 3V − 6; K₅, K₃,₃ non-planar (Kuratowski)
    Euler & Hamilton :: Euler circuit ⇔ connected + all even degrees; path ⇔ 0 or 2 odd vertices
    Colouring :: χ(Kₙ) = n; bipartite = 2; odd cycle = 3; planar ≤ 4
    Trees & matching :: Tree n−1 edges; bipartite ⇔ no odd cycle
  Linear algebra
    Determinant & rank :: Dependent rows ⇒ det 0; det(kA) = kⁿ det A; rank = # independent rows
    Systems of equations :: rank A = rank [A|b] = n unique; < n infinite; ≠ inconsistent
    Eigenvalues :: Σλ = trace, Πλ = det; triangular → diagonal entries; Aᵏ has λᵏ
  Probability & statistics
    Rules :: Bayes; independence P(A∩B) = P(A)P(B); total probability
    Distributions :: Binomial (np, npq), Poisson (λ, λ), Uniform, Exponential (1/λ), Normal (68-95-99.7)
    Expectation :: Linear: E[X+Y] = E[X]+E[Y]; Var(aX) = a²Var(X)
  Calculus
    Limits & derivatives :: sin x/x → 1; L’Hôpital for 0/0; maxima at f′=0, f″<0
    Integrals :: Definite integrals over symmetric limits of odd functions = 0
  Number theory
    GCD, mod, totient :: φ(p) = p−1 ; φ(n) = n Π(1 − 1/p) ; Fermat aᵖ⁻¹ ≡ 1 (mod p)
[toc] Theory of Computation
  Regular languages
    DFA / NFA / ε-NFA :: Equal power; NFA→DFA subset construction ≤ 2ⁿ states
    Minimisation :: Myhill–Nerode / table-filling; count = number of distinguishable classes
    Classic DFA sizes :: Divisible by k → k states; nth-from-right = a → 2ⁿ states; ending with w → |w|+1
    Regular expressions :: (a+b)* = (a*b*)*; Arden R = Q + RP → QP*
    Closure :: Union, ∩, complement, concat, star, reversal, homomorphism, difference — all closed
    Pumping lemma :: Proves NON-regularity; aⁿbⁿ, palindromes, a^(n²), a^prime not regular
  Context-free languages
    CFG & PDA :: NPDA ⇔ CFL; DPDA ⇔ DCFL (strictly smaller)
    Normal forms :: CNF A→BC | a (2n−1 steps) ; GNF A→aα (n steps)
    Closure :: CFL closed under ∪, concat, star, ∩ with regular; NOT ∩, complement. DCFL closed under complement
    Classic examples :: aⁿbⁿ, wwᴿ (CFL, not DCFL), ww (not CFL), aⁿbⁿcⁿ (not CFL)
    Ambiguity :: >1 parse tree ⇔ >1 LMD ⇔ >1 RMD; inherent ambiguity exists; ambiguity undecidable
  Turing machines
    Variants :: Multi-tape, NTM, 2-stack PDA all equal TM power; LBA → CSL
    Chomsky hierarchy :: Type 3 regular ⊂ Type 2 CFL ⊂ Type 1 CSL ⊂ recursive ⊂ Type 0 RE
    Decidability :: Recursive = halts always; RE = semi-decidable; L & L′ both RE ⇒ recursive
    Undecidable problems :: Halting, PCP, CFG ambiguity, CFG equivalence, L(CFG) = Σ*, Rice’s theorem
    Decidable problems :: DFA equivalence/emptiness/finiteness; CFG membership (CYK O(n³)) & emptiness
[cd] Compiler Design
  Phases
    Front end :: Lexical → syntax → semantic → intermediate code (machine independent)
    Back end :: Code optimisation → code generation; symbol table used by all phases
    Errors by phase :: Lexical: illegal char; syntax: missing ; ; semantic: type mismatch / undeclared
  Lexical analysis
    Tokens :: Keywords, identifiers, constants, operators, punctuation; string literal = 1 token
    Tools :: lex/flex (regex → DFA); yacc/bison (LALR(1) parser)
  Parsing
    Top-down :: Recursive descent, LL(1); needs no left recursion + left factoring; FIRST/FOLLOW table
    Bottom-up :: Shift-reduce, handles, reverse rightmost derivation
    LR family :: LR(0) ⊂ SLR ⊂ LALR ⊂ CLR; LALR states = SLR states; LALR merge → only R/R conflicts
    Operator precedence :: No ε-productions, no adjacent non-terminals
  Syntax-directed translation
    Attributes :: S-attributed (synthesized, bottom-up) ⊂ L-attributed (inherited from left/parent)
  Intermediate code
    Forms :: Three-address code, quadruples, triples, indirect triples, SSA, DAG, syntax tree
    Basic blocks & flow graphs :: Leaders: first stmt, jump targets, stmt after jump
  Optimisation
    Machine independent :: Constant folding/propagation, CSE, dead code, copy propagation, loop invariant motion, strength reduction
    Peephole :: Redundant load/store, unreachable code, algebraic simplification
    Data-flow analysis :: Reaching defs & available exprs (forward), live variables (backward)
  Runtime & code generation
    Runtime environment :: Activation records on stack (recursion); heap for dynamic data
    Register allocation :: Graph colouring of interference graph
[os] Operating Systems
  Processes & threads
    Process states :: New → Ready ↔ Running → Waiting → Ready; Running → Terminated
    PCB & context switch :: PCB holds state, PC, registers, memory info; switch is pure overhead
    fork() :: n forks → 2ⁿ processes; returns 0 to child, PID to parent
    Threads :: Share code/data/files; own stack/registers/PC; Linux uses 1:1 model
    Zombie & orphan :: Zombie: exited, not reaped; orphan: parent gone → adopted by init
  CPU scheduling
    Criteria :: TAT = CT − AT; WT = TAT − BT; response = first run − AT
    Algorithms :: FCFS (convoy), SJF/SRTF (optimal avg WT, starvation), RR (quantum), priority (aging), MLFQ
    Schedulers :: Long-term = degree of multiprogramming; medium = swapping; short = dispatcher
    Real-time :: RMS static (U ≤ n(2^(1/n) − 1)); EDF dynamic (U ≤ 1); priority inheritance
  Synchronisation
    Critical section :: Mutual exclusion, progress, bounded waiting; Peterson’s solution
    Semaphores & mutexes :: Counting/binary; wait/signal atomic; final value = init − P + V
    Classic problems :: Producer-consumer (empty, full, mutex), readers-writers, dining philosophers
    Hardware support :: Test-and-set, compare-and-swap; spinlocks busy-wait
  Deadlock
    Coffman conditions :: Mutual exclusion, hold & wait, no preemption, circular wait
    Handling :: Prevention, avoidance (Banker’s), detection + recovery, ignore (ostrich)
    Resource formula :: n processes each needing k: deadlock-free if R ≥ n(k − 1) + 1
  Memory management
    Allocation :: First/best/worst/next fit; internal vs external fragmentation; compaction
    Paging :: Pages/frames; page table size = #pages × PTE size; multilevel & inverted tables
    TLB & EAT :: EAT = h(t + m) + (1 − h)(t + 2m) for single-level paging
    Segmentation :: Variable size, external fragmentation; segment table (base, limit)
  Virtual memory
    Demand paging :: EAT = (1 − p)·m + p·fault service time; dirty bit; copy-on-write
    Replacement :: FIFO (Belady’s anomaly), Optimal (min faults), LRU, clock/second chance
    Thrashing :: Too little memory per process; working-set model, page-fault frequency
  Storage & files
    Disk scheduling :: FCFS, SSTF (starvation), SCAN (elevator), C-SCAN, LOOK, C-LOOK
    Disk timing :: Access = seek + rotational latency (half rotation) + transfer
    File allocation :: Contiguous (ext. frag), linked (FAT), indexed (inode)
    Inode :: Direct + single/double/triple indirect; names in directories; hard vs soft links
  Misc
    Kernel types :: Monolithic, microkernel, hybrid; user vs kernel mode; privileged instructions
    I/O :: Programmed, interrupt-driven, DMA; spooling, buffering
[cn] Computer Networks
  Models
    OSI 7 layers :: Physical, Data link, Network, Transport, Session, Presentation, Application
    TCP/IP 4 layers :: Link, Internet, Transport, Application
    Devices by layer :: Hub/repeater L1, switch/bridge L2, router L3, gateway L4–L7
  Physical layer
    Capacity :: Nyquist 2B log₂L; Shannon B log₂(1 + SNR)
    Encoding & media :: Manchester (2× baud); fibre immune to EMI; TDM/FDM/WDM/CDMA
  Data link layer
    Framing & error detection :: Bit stuffing after five 1s; parity, checksum, CRC (r = degree)
    Error correction :: Hamming: 2^r ≥ m + r + 1; detect d → dmin d+1; correct d → 2d+1
    Flow control :: Stop-and-wait U = 1/(1 + 2a); GBN window 2ⁿ − 1; SR window 2ⁿ⁻¹
    MAC protocols :: ALOHA 18.4%, slotted 36.8%; CSMA/CD (Tt ≥ 2Tp) vs CSMA/CA (Wi-Fi)
    Ethernet & LAN :: 48-bit MAC; frame 64–1518 B; VLAN 802.1Q; STP 802.1D; switch collision domains
    Wireless :: 802.11b 11M, a/g 54M, n 600M, ac ~3.5–6.9G, ad 7G (60 GHz)
  Network layer
    IPv4 addressing :: Classes A–E; private 10/8, 172.16/12, 192.168/16; /n → 2^(32−n) − 2 hosts
    Subnetting & CIDR :: Network = IP AND mask; broadcast = all host bits 1; supernetting
    IPv4 header :: 20–60 B; TTL; fragment offset in 8-byte units; max datagram 65,535
    IPv6 :: 128-bit; 40-byte fixed header; no router fragmentation; :: once
    Routing :: Distance vector (RIP, count-to-infinity), link state (OSPF, Dijkstra), path vector (BGP)
    Support protocols :: ARP (IP→MAC), DHCP (UDP 67/68, DORA), ICMP (ping, traceroute), NAT
  Transport layer
    TCP vs UDP :: TCP 20–60 B header, reliable, ordered; UDP 8 B, connectionless
    TCP connection :: 3-way handshake; 4-way close; TIME_WAIT = 2·MSL
    Flow & congestion :: rwnd vs cwnd; slow start → ssthresh → AIMD; timeout → cwnd 1
    Throughput :: Window ≥ bandwidth × RTT (BDP); window scale beyond 64 KB
  Application layer
    Ports :: FTP 20/21, SSH 22, Telnet 23, SMTP 25, DNS 53, DHCP 67/68, HTTP 80, POP3 110, IMAP 143, SNMP 161, HTTPS 443
    Protocols :: DNS (UDP), HTTP stateless, SMTP push, POP/IMAP pull, SNMP management
[dbms] DBMS
  Data models & ER
    ER diagram :: Weak entity (double box), multivalued (double ellipse), derived (dashed)
    ER → tables :: 1:N → FK on N side; M:N → separate table; weak entity → owner key + discriminator
    Architecture :: External/conceptual/internal; logical vs physical data independence
  Relational model
    Keys :: Super ⊇ candidate ⊇ primary; foreign key = referential integrity
    Relational algebra :: σ π ∪ − × ρ basic; ⋈, ∩, ÷ derived; division = "for all"
    Join sizes :: R × S = |R|·|S|; natural join 0 … |R|·|S|
  SQL
    Clause order :: FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY
    NULL semantics :: Comparisons UNKNOWN; aggregates ignore NULL except COUNT(*)
    DDL / DML / DCL / TCL :: CREATE ALTER DROP TRUNCATE / SELECT INSERT UPDATE DELETE / GRANT REVOKE / COMMIT ROLLBACK
    Views, triggers, indexes :: View = virtual table; composite index uses leftmost prefix
  Normalisation
    FDs & closure :: Armstrong axioms; attribute closure to find keys
    Normal forms :: 1NF atomic; 2NF no partial dep; 3NF X superkey or A prime; BCNF X superkey; 4NF MVD; 5NF join dep
    Decomposition :: Lossless iff common attrs key of one side; BCNF may lose dependencies; 3NF keeps both
  Transactions
    ACID :: Atomicity & durability (recovery), consistency, isolation (concurrency control)
    Serializability :: Conflict-serializable ⇔ acyclic precedence graph; view ⊇ conflict
    Recoverability :: Recoverable ⊃ cascadeless ⊃ strict
    Concurrency control :: 2PL (serializable, deadlocks possible), strict 2PL, timestamp, Thomas write rule
    Deadlock schemes :: Wait-die (older waits), wound-wait (older preempts)
    Isolation levels :: Read uncommitted < read committed < repeatable read < serializable
    Recovery :: WAL, undo/redo logs, checkpoints, deferred vs immediate update
  Storage & indexing
    File organisation :: Blocking factor ⌊B/R⌋; binary search log₂(blocks)
    Indexes :: Primary/clustered (sparse ok), secondary (dense); B+ trees
  NoSQL & distributed
    NoSQL types :: Key-value (Redis), document (MongoDB), wide-column (Cassandra/HBase), graph (Neo4j)
    CAP & BASE :: Pick 2 of C, A, P; BASE = eventual consistency
[coa] Computer Organization
  Performance
    CPU time :: IC × CPI × cycle time; MIPS = f/(CPI × 10⁶)
    Amdahl’s law :: Speedup = 1/((1 − p) + p/s)
  Instruction set
    Addressing modes :: Immediate, direct, indirect, register, register-indirect, indexed, base, PC-relative, auto-inc
    Instruction formats :: 0/1/2/3-address; opcode + operand field bit budgeting
    RISC vs CISC :: RISC: fixed length, load-store, many registers, hardwired; CISC: microcoded
  Control unit
    Hardwired vs microprogrammed :: Hardwired fast; microprogrammed flexible (horizontal vs vertical)
  Pipelining
    Timing :: k + n − 1 cycles; speedup → k; clock = max stage + latch
    Hazards :: Structural, data (RAW true; WAR/WAW name), control; forwarding, stalls, branch prediction
    Advanced ILP :: Superscalar, VLIW, out-of-order (Tomasulo), register renaming
  Memory hierarchy
    Cache mapping :: Direct, set-associative, fully associative; tag/index/offset split
    Cache performance :: AMAT = hit + miss rate × penalty; 3 Cs of misses
    Write policies :: Write-through vs write-back (dirty bit); write-allocate
    Main memory :: SRAM (cache) vs DRAM (refresh); chip counting; interleaving
  Arithmetic
    Integer representation :: 2’s complement range −2ⁿ⁻¹…2ⁿ⁻¹−1; overflow when carry-in ≠ carry-out of MSB
    Multiplication :: Booth’s algorithm for signed numbers
    IEEE 754 :: Single 1/8/23 bias 127; double 1/11/52 bias 1023; NaN, ∞, denormals
  I/O
    Interrupts :: Vectored vs non-vectored; daisy chain priority; trap vs interrupt
    DMA :: Cycle stealing vs burst; CPU freed during transfer
    Memory-mapped vs isolated I/O :: Load/store vs IN/OUT
  Parallel architecture
    Flynn’s taxonomy :: SISD, SIMD (GPU/vector), MISD, MIMD (multicore)
    Coherence :: MESI protocol; snooping vs directory
[dl] Digital Logic
  Number systems
    Conversions :: Binary ↔ octal (3 bits) ↔ hex (4 bits); fractions by ×2
    Signed numbers :: Sign-magnitude, 1’s, 2’s complement
    Codes :: BCD, Excess-3 (self-complementing), Gray (one bit change), parity
  Boolean algebra
    Laws :: De Morgan, absorption A + AB = A, A + A′B = A + B, consensus
    Universal gates :: NAND, NOR; XOR needs 4 NAND or 5 NOR
    Minimisation :: K-map groups of 2ᵏ eliminate k variables; don’t-cares; prime/essential implicants
    Functions of n variables :: 2^(2ⁿ) distinct functions; 2ⁿ minterms
  Combinational circuits
    Adders :: HA (XOR, AND); FA (3 in, 2 out); ripple vs carry look-ahead
    MUX / DEMUX :: 2ⁿ:1 MUX needs n selects; MUX implements any function of n+1 variables
    Decoder / encoder :: n → 2ⁿ decoder + OR = any function; priority encoder
    Comparators & hazards :: Static hazards fixed by consensus terms
  Sequential circuits
    Latches & flip-flops :: SR (S=R=1 invalid), JK (toggle), D, T; race-around → master-slave
    Characteristic equations :: JK: Q⁺ = JQ′ + K′Q; T: Q⁺ = T ⊕ Q; D: Q⁺ = D
    Counters :: Ripple (async) vs synchronous; MOD-N needs ⌈log₂N⌉ FFs; ring n states; Johnson 2n
    Shift registers :: SISO, SIPO, PISO, PIPO; n-bit delay = n clock periods
    FSMs :: Moore (output on state) vs Mealy (state + input)
  Logic families
    Comparison :: CMOS lowest power; ECL fastest; TTL classic; fan-in / fan-out
[prog] Programming & OOP
  C language
    Operators :: Precedence & associativity; short-circuit && ||; i++ vs ++i; UB on double modification
    Data types & sizeof :: char = 1; struct padding; union = largest member; sizeof string includes \\0
    Pointers :: Arithmetic scales by type size; pointer to function int (*f)(int); NULL deref = UB
    Storage classes :: auto, register, static (retains value, zero-init), extern
    Memory :: malloc/calloc/realloc/free; leaks, dangling & wild pointers, double free
    Preprocessor :: Macro pitfalls — always parenthesise; #include, #define, conditional compile
    Control flow :: switch fall-through; empty-body loops; recursion tracing
    Embedded C :: volatile for hardware registers/ISR variables; bit manipulation x & (x−1)
  C++ / OOP
    Pillars :: Encapsulation, abstraction, inheritance, polymorphism
    Polymorphism :: Overloading (compile time) vs overriding with virtual (runtime, vtable)
    Classes :: Constructors, copy constructor, destructor (virtual in base), friend, access specifiers
    Inheritance :: Types; diamond problem → virtual inheritance; abstract class = pure virtual
  Java
    Basics :: JVM bytecode portable; heap objects + GC; Strings immutable; final; interfaces
    Exceptions & collections :: Checked vs unchecked; Set no duplicates; HashMap, ArrayList
  Python
    Essentials :: / true division, // floor; tuples immutable; list * n repeats
  Concepts
    Parameter passing :: Value, reference, value-result, name
    Scoping :: Static (lexical) vs dynamic
[se] Software Engineering
  Process models
    SDLC models :: Waterfall (fixed reqs), V-model (test per phase), prototyping (unclear reqs), spiral (risk), incremental, RAD, agile/Scrum
    Maturity :: CMM: initial → repeatable → defined → managed → optimizing; ISO 9001
  Requirements
    SRS :: IEEE 830: correct, unambiguous, complete, consistent, verifiable, traceable
    Functional vs non-functional :: What it does vs performance, reliability, security
  Estimation & planning
    Size metrics :: LOC, function points FP = UFP × (0.65 + 0.01ΣFᵢ)
    COCOMO :: E = a·KLOC^b; organic, semi-detached, embedded
    Scheduling :: PERT (o + 4m + p)/6; CPM critical path = longest, zero slack; Gantt
    Risk management :: Identify → analyse → plan → monitor
  Design
    Coupling & cohesion :: Low coupling (data best, content worst); high cohesion (functional best)
    Modelling :: DFD (context = level 0), ER (static), structure chart, HIPO, UML diagrams
    Metrics :: Cyclomatic V(G) = E − N + 2P = decisions + 1; fan-in / fan-out; Halstead
    Design patterns :: Singleton, factory, observer, adapter, MVC
  Testing
    Levels :: Unit → integration (stubs/drivers) → system → acceptance (alpha/beta)
    Black box :: Equivalence partitioning, boundary values, decision tables, cause-effect
    White box :: Statement < branch < condition < MC/DC < multiple-condition coverage; basis paths
    Other testing :: Regression, smoke, sanity, stress, load, mutation
  Maintenance & quality
    Maintenance types :: Corrective, adaptive, perfective, preventive
    Reliability :: MTBF = MTTF + MTTR; availability = MTTF/MTBF
[sec] Information Security
  Goals
    CIA + more :: Confidentiality, integrity, availability; authentication, non-repudiation, access control (X.800)
  Symmetric crypto
    Algorithms :: DES (56-bit key, 16 rounds), 3DES, AES (128-bit block; 128/192/256 key; 10/12/14 rounds)
    Modes :: ECB (leaks patterns), CBC, CTR, GCM (authenticated)
    Key counts :: n users pairwise: n(n−1)/2 symmetric keys vs 2n public/private keys
  Public-key crypto
    RSA :: n = pq, φ = (p−1)(q−1), ed ≡ 1 mod φ; c = mᵉ mod n
    Diffie-Hellman & ECC :: Discrete log hardness; DH vulnerable to MITM without authentication
    Digital signatures & PKI :: Sign with sender private key; X.509 certificates; CA, CRL/OCSP
  Hashing & MAC
    Hash properties :: Pre-image, second pre-image, collision resistance; birthday 2^(n/2)
    Algorithms :: MD5 128, SHA-1 160, SHA-256; HMAC = keyed hash; digest needs no key
  Network security
    Protocols :: TLS, IPsec (AH = integrity, ESP = confidentiality; tunnel hides inner IP), SSH, Kerberos
    Perimeter :: Packet filter, stateful firewall, proxy, DMZ, IDS vs IPS, NAT, VPN
    Attacks :: DoS/DDoS, SYN flood, ping of death, ARP spoofing, MITM, replay, sniffing
  Application security
    Web attacks :: SQL injection (prepared statements), XSS, CSRF, buffer overflow
    Malware :: Virus, worm, trojan, ransomware, rootkit, logic bomb, spyware
    Social engineering :: Phishing, vishing, tailgating, shoulder surfing, dumpster diving
  Access control & auth
    Models :: DAC, MAC (Bell-LaPadula no read up/no write down; Biba integrity), RBAC
    Authentication :: MFA, salted slow hashes, CAPTCHA against bots
[ai] AI & ML
  Agents & search
    Agent types :: Simple reflex, model-based, goal-based, utility-based, learning; PEAS
    Uninformed search :: BFS (complete, optimal for unit cost), DFS (O(bm) space), IDDFS, UCS
    Informed search :: Greedy best-first h(n); A* g + h (admissible ⇒ optimal)
    Local search :: Hill climbing (local maxima), simulated annealing, genetic algorithms
    Adversarial :: Minimax, alpha-beta pruning O(b^(d/2))
    CSP :: Backtracking, MRV, forward checking, arc consistency
  Knowledge & reasoning
    Logic :: Propositional & first-order logic; connectives ¬ ∧ ∨ ⇒ ⇔; resolution needs CNF
    Inference :: Modus ponens/tollens; forward (data-driven) vs backward (goal-driven) chaining
    Uncertainty :: Bayes rule; Bayesian networks (hybrid = discrete + continuous); fuzzy logic [0,1]
  Machine learning
    Paradigms :: Supervised, unsupervised, reinforcement (Q-learning, SARSA)
    Algorithms :: Linear/logistic regression, decision trees (classification & regression), SVM, KNN, Naive Bayes, random forest
    Clustering & reduction :: K-means (partitional), hierarchical (agglomerative/divisive), PCA
    Evaluation :: Precision, recall, F1, accuracy, confusion matrix; bias-variance; cross-validation
    Neural networks :: Perceptron can’t do XOR; sigmoid/tanh/ReLU; backprop = chain rule; CNN, RNN
[cloud] Cloud, Big Data & Virtualization
  Cloud computing
    NIST characteristics :: On-demand, broad network access, pooling, rapid elasticity, measured service
    Service models :: IaaS (EC2), PaaS (App Engine), SaaS (Gmail), FaaS/serverless (Lambda)
    Deployment models :: Public, private, community, hybrid; cloud bursting
    Concepts :: Elasticity, multi-tenancy, SLA, horizontal vs vertical scaling, edge/fog
  Virtualization
    Hypervisors :: Type-1 bare metal (ESXi, Xen, Hyper-V, KVM); Type-2 hosted (VirtualBox)
    Techniques :: Full (unmodified guest), para (modified guest, hypercalls), hardware-assisted (VT-x/AMD-V)
    Containers :: Share host kernel; Docker, Kubernetes orchestration; live migration of VMs
  Big Data
    5 Vs :: Volume, velocity, variety, veracity, value
    Data types :: Structured (tables), semi-structured (XML/JSON), unstructured (text, images, video)
    Hadoop ecosystem :: HDFS (NameNode, DataNodes, 128 MB blocks, ×3), MapReduce, YARN, Hive, Pig, HBase
    Streaming & fast processing :: Spark (in-memory), Flink, Storm, Kafka
    NoSQL & distribution :: Cassandra (distributed AP), MongoDB, Redis; CAP, eventual consistency
  Tools
    Monitoring & management :: JMX (Java management), SNMP
[apt] Aptitude & Reasoning
  Quantitative
    Arithmetic :: Percentages, profit/loss, SI/CI, ratio & mixture, averages
    Time-speed-work :: Trains, boats, pipes, work rates (1/a + 1/b)
    Geometry & mensuration :: Max rectangle area for perimeter → square; volume scales by k³
    Number series :: Look for differences, ratios, ×n + n patterns
  Logical
    Syllogisms :: Venn diagrams; "some/no" complementary pair → either-or
    Statement & conclusion / course of action :: Only what must follow; avoid extreme actions
    Seating, directions, blood relations :: Draw it; Pythagoras for distances
    Calendar & clock :: Odd days method; hand angle = |30H − 5.5M|; mirror time = 11:60 − t
  Situational judgement
    Workplace scenarios :: Communicate honestly with the responsible person
`);
