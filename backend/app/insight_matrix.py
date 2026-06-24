# app/insight_matrix.py
# ---------------------------------------------------------------------------
# Static insight corpus — 150 distinct, professional engineering evaluation
# sentences. Embeddings are pre-computed once at server boot and cached in
# GLOBAL_INSIGHT_EMBEDDINGS for O(1) retrieval during cosine matching.
# ---------------------------------------------------------------------------
from sentence_transformers import SentenceTransformer
import numpy as np
from typing import List

INSIGHT_CORPUS: List[str] = [
    # 1-30: Core engineering fundamentals
    "Demonstrates strong full-stack ownership with consistent delivery across distributed teams.",
    "Shows deep expertise in systems design and low-latency backend infrastructure.",
    "Exhibits measurable impact through open-source contributions and production-grade codebases.",
    "Combines solid data engineering skills with real-world ML pipeline deployment experience.",
    "Has a proven track record of scaling microservices architectures at high-growth startups.",
    "Brings hands-on cloud infrastructure experience with strong IaC and DevOps practices.",
    "Demonstrates structured problem-solving ability with a clear record of technical mentorship.",
    "Shows breadth across languages and frameworks backed by consistent project delivery.",
    "Carries domain depth in security engineering with practical vulnerability management history.",
    "Exhibits strong analytical acumen with data-driven decision making in prior roles.",
    "Has delivered production-ready features in cross-functional agile teams consistently.",
    "Combines mobile engineering expertise with performance optimization across iOS and Android.",
    "Demonstrates end-to-end ownership from architecture to deployment in fast-paced environments.",
    "Has strong foundations in distributed systems with experience in consensus and fault tolerance.",
    "Shows significant experience in API design, versioning, and contract-driven development.",
    "Brings embedded systems or firmware background bridging hardware and software effectively.",
    "Has led platform migrations and demonstrated zero-downtime deployment competency.",
    "Exhibits strong observability practices including metrics, tracing, and structured logging.",
    "Demonstrates depth in relational and NoSQL database design and query optimization.",
    "Shows experience in technical hiring, team building, and engineering culture development.",
    "Has a strong academic foundation paired with rapid applied engineering ramp-up.",
    "Demonstrates disciplined test-driven development and high code coverage standards.",
    "Brings expertise in real-time data streaming with Kafka or equivalent pipeline tooling.",
    "Has demonstrated effective cross-team collaboration and stakeholder communication.",
    "Shows experience delivering ML models to production with latency and drift monitoring.",
    "Exhibits strong command over containerization and orchestration with Kubernetes.",
    "Has consistent history of reducing operational toil through automation and tooling.",
    "Brings deep frontend engineering skills with focus on accessibility and performance.",
    "Demonstrates experience with compliance-driven engineering in regulated industries.",
    "Shows clear progression from IC to technical leadership with measurable team outcomes.",
    # 31-60: Platform and infrastructure depth
    "Has shipped features to millions of users with reliability and rollback discipline.",
    "Demonstrates multi-cloud fluency with practical cost optimization strategies applied.",
    "Brings strong algorithm design background with competitive programming track record.",
    "Shows experience in graph databases and knowledge graph construction for complex domains.",
    "Has built internal developer tooling that measurably improved team velocity.",
    "Exhibits structured incident response skills with documented post-mortem ownership.",
    "Demonstrates experience in geospatial data engineering and location-based services.",
    "Brings a strong research-to-production pipeline background in NLP and language models.",
    "Has clear experience in designing and operating multi-tenant SaaS architectures.",
    "Shows proficiency in event-driven architecture and asynchronous messaging patterns.",
    "Demonstrates experience integrating third-party APIs and managing vendor relationships.",
    "Has delivered data warehousing and BI solutions at enterprise scale.",
    "Exhibits strong documentation culture and has authored public technical writing.",
    "Brings experience in recommendation systems and personalization engine development.",
    "Has measurable contributions to platform reliability through chaos engineering practices.",
    "Shows expertise in authentication, authorization, and identity management systems.",
    "Demonstrates proficiency in TypeScript and modern frontend build tooling at scale.",
    "Has built and maintained large-scale ETL pipelines with strong data quality controls.",
    "Exhibits experience in A/B testing infrastructure and experimentation platforms.",
    "Shows command of the full software lifecycle from ideation to deprecation.",
    "Has experience in computer vision applications with practical deployment history.",
    "Demonstrates strong proficiency in Python ecosystem tooling for data science workflows.",
    "Brings experience in edge computing and IoT platform development.",
    "Has strong record of reducing system latency through profiling and targeted optimization.",
    "Shows experience delivering technical roadmaps aligned with business objectives.",
    "Demonstrates depth in Rust or C++ systems programming with performance-critical focus.",
    "Has built developer platforms and internal APIs adopted widely across engineering orgs.",
    "Exhibits experience in feature flagging, gradual rollouts, and progressive delivery.",
    "Shows strong capacity for independent research and rapid technology evaluation.",
    "Brings hands-on experience with search infrastructure including Elasticsearch or Solr.",
    # 61-90: Specialised domains
    "Has demonstrated experience building accessible, WCAG-compliant user interfaces.",
    "Shows consistent growth in scope and complexity of technical problems solved over career.",
    "Exhibits cross-functional product sense paired with strong execution discipline.",
    "Demonstrates experience managing database schema migrations in production environments.",
    "Has built high-throughput data ingestion pipelines for analytics and reporting use cases.",
    "Shows evidence of strong code review culture and constructive peer feedback.",
    "Brings experience in AI safety, model evaluation, and responsible ML deployment.",
    "Has managed on-call rotations and demonstrated SLA ownership under pressure.",
    "Exhibits experience in financial technology with strong understanding of transaction systems.",
    "Demonstrates ability to onboard quickly to legacy codebases and reduce technical debt.",
    "Has built CLI tooling and developer ergonomics solutions adopted by engineering teams.",
    "Shows experience in healthcare technology with data privacy and HIPAA compliance focus.",
    "Brings experience leading architecture review processes and design decision documentation.",
    "Has strong record of cross-timezone async collaboration with globally distributed teams.",
    "Demonstrates hands-on experience with compiler toolchains or language runtime internals.",
    "Shows experience building and deploying conversational AI and chatbot systems.",
    "Has contributed to engineering culture through talks, blogs, or community leadership.",
    "Exhibits strong GraphQL API design and federation architecture experience.",
    "Demonstrates experience in ad-tech, bidding systems, or real-time auction platforms.",
    "Has a solid background in simulation or modeling for scientific or industrial domains.",
    "Shows experience in game development with performance-critical rendering pipelines.",
    "Brings experience building fraud detection and anomaly detection systems at scale.",
    "Has delivered developer experience improvements reducing onboarding time measurably.",
    "Exhibits strong Unix/Linux systems administration and scripting foundation.",
    "Demonstrates experience in quantum computing toolkits or adjacent research areas.",
    "Has led successful technology migrations with minimal service disruption.",
    "Shows experience with autonomous systems, robotics, or real-time control software.",
    "Brings experience in supply chain or logistics technology with operational domain depth.",
    "Has hands-on experience with AR/VR development or immersive application platforms.",
    "Demonstrates consistent impact in early-stage startup environments with limited resources.",
    # 91-120: Leadership, process, and culture
    "Shows experience building batch processing systems for large-scale data transformation.",
    "Has a clear record of mentoring junior engineers to promotion-level performance.",
    "Exhibits deep integration experience across ERP, CRM, or enterprise platform ecosystems.",
    "Demonstrates experience building multi-modal AI pipelines combining vision and language.",
    "Has strong experience in WebAssembly and high-performance browser-side computation.",
    "Shows experience in developer relations or technical evangelism with community impact.",
    "Brings experience in blockchain or smart contract development with production deployments.",
    "Has contributed to open standards or protocol working groups in relevant domains.",
    "Demonstrates strong background in network engineering and protocol-level system design.",
    "Shows evidence of navigating ambiguous requirements and delivering structured outcomes.",
    "Has driven engineering org-wide initiatives that reduced incident frequency measurably.",
    "Exhibits a strong pattern of converting exploratory prototypes into hardened production systems.",
    "Brings experience running effective sprint ceremonies and maintaining healthy team backlogs.",
    "Demonstrates repeated success shipping zero-regression releases through automation pipelines.",
    "Has built self-serve data platforms enabling non-engineers to query production datasets safely.",
    "Shows experience establishing SLO and error-budget frameworks adopted across multiple teams.",
    "Brings a history of contributing well-scoped design documents that unblock cross-team consensus.",
    "Demonstrates experience scaling engineering headcount without degrading delivery throughput.",
    "Has reduced cloud infrastructure spend significantly through right-sizing and reserved capacity.",
    "Exhibits a consistent pattern of advocating for technical debt reduction alongside feature work.",
    "Shows experience building developer portals and internal knowledge bases used org-wide.",
    "Has led migration efforts from monolith to service-oriented architecture with measurable gains.",
    "Brings a background in platform engineering with golden-path tooling and paved-road adoption.",
    "Demonstrates ability to translate ambiguous product requirements into precise technical specs.",
    "Has maintained and improved legacy systems while enabling incremental modernization in parallel.",
    "Shows experience building hiring pipelines and structured interview loops for engineering roles.",
    "Brings evidence of establishing coding standards and linting rules adopted across repositories.",
    "Demonstrates cross-discipline fluency spanning both product and infrastructure engineering.",
    "Has contributed to capacity planning and traffic modelling for high-scale production systems.",
    "Shows experience building internal analytics dashboards used by executive leadership.",
    # 121-150: Emerging tech and advanced specialisms
    "Brings experience in LLM fine-tuning and RLHF workflows for domain-specific applications.",
    "Has deployed retrieval-augmented generation systems in production with latency constraints.",
    "Demonstrates proficiency in vector database design and approximate nearest-neighbour search.",
    "Shows experience building real-time ML feature stores used across multiple model pipelines.",
    "Has implemented model quantization and pruning to meet edge-device inference requirements.",
    "Brings experience with federated learning and privacy-preserving ML across distributed nodes.",
    "Demonstrates experience building data labelling pipelines and human-in-the-loop feedback loops.",
    "Has architected multi-region active-active deployments with conflict-free replication.",
    "Shows experience implementing CQRS and event sourcing patterns in high-write systems.",
    "Brings expertise in columnar storage formats and query engine optimisation for analytics.",
    "Has built data mesh architectures enabling domain-level data ownership at scale.",
    "Demonstrates experience with chaos engineering tooling and game-day exercise facilitation.",
    "Shows proficiency in eBPF-based observability and kernel-level performance tracing.",
    "Has implemented zero-trust networking and micro-segmentation across cloud workloads.",
    "Brings experience in confidential computing and hardware-backed secure enclave deployments.",
    "Demonstrates experience building multi-agent orchestration systems for autonomous workflows.",
    "Has shipped production systems leveraging hardware accelerators beyond standard GPU compute.",
    "Shows experience in formal verification and model checking for safety-critical software.",
    "Brings background in high-frequency trading systems requiring sub-millisecond latency.",
    "Demonstrates experience building WASM-compiled runtimes for sandboxed plugin execution.",
    "Has delivered production LLM inference infrastructure with autoscaling and cost controls.",
    "Shows experience in robotics middleware including ROS and real-time sensor fusion pipelines.",
    "Brings expertise in digital twin architecture and simulation-driven product development.",
    "Has built compliance automation pipelines for SOC 2, ISO 27001, or PCI-DSS certification.",
    "Demonstrates experience designing APIs for AI-native products with streaming response patterns.",
    "Shows background in bioinformatics or scientific computing with HPC cluster experience.",
    "Has built real-time collaborative editing infrastructure using CRDTs or OT algorithms.",
    "Brings experience in satellite or low-power communication protocol engineering.",
    "Demonstrates expertise in spatial computing and mixed-reality application development.",
    "Shows a history of technical due diligence contributions during M&A and acquisition processes.",
]

# ---------------------------------------------------------------------------
# Module-level cache — populated once at server startup
# Shape: (150, embedding_dim) — normalised for direct dot-product cosine sim
# ---------------------------------------------------------------------------
GLOBAL_INSIGHT_EMBEDDINGS: np.ndarray | None = None


def init_insight_matrix(model: SentenceTransformer) -> None:
    """
    Batch-encode all 150 insight strings and store the normalised vectors in
    GLOBAL_INSIGHT_EMBEDDINGS. Called exactly once inside the FastAPI lifespan
    startup block. Read-only after that — safe for concurrent requests.
    """
    global GLOBAL_INSIGHT_EMBEDDINGS
    GLOBAL_INSIGHT_EMBEDDINGS = model.encode(
        INSIGHT_CORPUS,
        convert_to_numpy=True,
        normalize_embeddings=True,   # L2-normalise → dot product == cosine sim
        batch_size=64,               # encode in batches to keep RAM flat
        show_progress_bar=False,
    )


def assign_insight(candidate_text: str, model: SentenceTransformer) -> str:
    """
    Vectorise candidate_text, run a single vectorised dot-product against the
    cached 150-row matrix, and return the best-matching insight string.
    """
    if GLOBAL_INSIGHT_EMBEDDINGS is None:
        raise RuntimeError(
            "Insight matrix not initialised. Ensure init_insight_matrix() "
            "is called inside the FastAPI lifespan startup block."
        )

    candidate_vec = model.encode(
        candidate_text,
        convert_to_numpy=True,
        normalize_embeddings=True,
    )
    # Matrix-vector dot product → shape (150,); argmax gives best match index
    similarities = GLOBAL_INSIGHT_EMBEDDINGS @ candidate_vec
    best_index = int(np.argmax(similarities))
    return INSIGHT_CORPUS[best_index]
