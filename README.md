# Smart Campus Resource Booking System

An enterprise-grade, full-stack campus facility management and reservation platform designed for universities to reserve, monitor, approve, and manage campus facilities (**Classrooms**, **Computer & Academic Laboratories**, and **Auditoriums**) with server-side concurrency control, role-based authorization, and persistent audit logging.

---

## 1. System Architecture

```
                                    ┌────────────────────────────────────────────────────────┐
                                    │               Browser Client (React 18 + Vite)         │
                                    │   Tailwind CSS • Lucide Icons • Recharts • Sonner      │
                                    └───────────────────────────┬────────────────────────────┘
                                                                │ REST API (JSON / JWT)
                                                                ▼
                                    ┌────────────────────────────────────────────────────────┐
                                    │           Spring Boot 3.3.4 Application                │
                                    │                                                        │
                                    │  ┌──────────────────────────────────────────────────┐  │
                                    │  │  Spring Security 6 (Stateless JJWT Filter)       │  │
                                    │  └────────────────────────┬─────────────────────────┘  │
                                    │                           ▼                            │
                                    │  ┌──────────────────────────────────────────────────┐  │
                                    │  │  REST Controllers (Auth, Resource, Booking, Admin│  │
                                    │  └────────────────────────┬─────────────────────────┘  │
                                    │                           ▼                            │
                                    │  ┌──────────────────────────────────────────────────┐  │
                                    │  │  Service Layer with Pessimistic Locking Engine   │  │
                                    │  └────────────────────────┬─────────────────────────┘  │
                                    │                           ▼                            │
                                    │  ┌──────────────────────────────────────────────────┐  │
                                    │  │  Spring Data JPA / Hibernate ORM                 │  │
                                    │  └────────────────────────┬─────────────────────────┘  │
                                    └───────────────────────────┼────────────────────────────┘
                                                                │
                                       ┌────────────────────────┴────────────────────────┐
                                       ▼                                                 ▼
                        ┌───────────────────────────────┐                 ┌─────────────────────────────┐
                        │   Flyway Schema Migrations    │                 │  Database Persistence       │
                        │   (V1 Schema, V2 Seed Data)   │                 │  • Local Dev: H2 MySQL Mode │
                        └───────────────────────────────┘                 │  • Docker/Prod: MySQL 8.0   │
                                                                          └─────────────────────────────┘
```

---

## 2. Technology Stack

### Frontend
- **Framework**: React 18 with Vite & TypeScript
- **Styling**: Tailwind CSS with custom university navy-blue brand tokens
- **Routing**: React Router v6 with Role-aware Guards
- **Icons**: Lucide React
- **API Communication**: Axios with centralized request/response interceptors
- **Visualizations**: Recharts (Pie & Bar charts)
- **Toasts**: Sonner notifications
- **Testing**: Vitest & React Testing Library

### Backend
- **Framework**: Java 21 & Spring Boot 3.3.4
- **Security**: Spring Security 6 with JJWT 0.12.6 stateless token authentication
- **ORM & Data**: Spring Data JPA & Hibernate 6
- **Database Migrations**: Flyway Core & Flyway MySQL
- **Validation**: Jakarta Bean Validation API
- **API Documentation**: SpringDoc OpenAPI 3 (Swagger UI)
- **Testing**: JUnit 5, Mockito, Spring Boot Test

### Database
- **Production / Docker**: MySQL 8.0 with InnoDB transactional engine
- **Local Dev Default**: H2 Database configured in MySQL Mode (`MODE=MySQL`) with file persistence
- **Concurrency Control**: Pessimistic Write Locking (`SELECT ... FOR UPDATE`)

---

## 3. Concurrency & Double-Booking Prevention

To eliminate race conditions and double-bookings when multiple users attempt to reserve the same facility simultaneously:

1. **Transactional Boundary**: Reservation creation runs inside an isolated transaction:
   ```java
   @Transactional(isolation = Isolation.READ_COMMITTED)
   ```
2. **Pessimistic Resource Locking**: The target resource row is locked at the database level:
   ```java
   @Lock(LockModeType.PESSIMISTIC_WRITE)
   @Query("SELECT r FROM Resource r WHERE r.id = :id")
   Optional<Resource> findByIdWithLock(@Param("id") Long id);
   ```
3. **Overlap Conflict Formula**: Any reservation satisfying the following criteria triggers an immediate `HTTP 409 Conflict`:
   $$\text{existing.startTime} < \text{requested.endTime} \quad \text{AND} \quad \text{existing.endTime} > \text{requested.startTime}$$
   Applied across active statuses: `PENDING` and `APPROVED`.
4. **Approval Revalidation**: When an administrator approves a pending request, the system re-locks the resource and re-validates the time slot to ensure no concurrent approval has taken place.

---

## 4. User Roles & Seed Demo Credentials

The application provides instant **one-click sign-in buttons** on the Login page for seamless testing:

| Role | Name | Email | Password | Responsibilities |
|---|---|---|---|---|
| **ADMIN** | Dr. Eleanor Vance | `admin@campus.edu` | `Password@123` | Full administrative control, facility CRUD, approvals/rejections, user roles, policies, audit logs |
| **FACULTY** | Prof. Alan Turing | `faculty@campus.edu` | `Password@123` | Class/department bookings, schedule view, approval tracking, notifications |
| **STUDENT** | Sarah Connor | `student@campus.edu` | `Password@123` | Facility catalog search, submit reservation requests, cancel own requests, notifications |
| **STUDENT 2** | Alex Rivera | `student2@campus.edu` | `Password@123` | Additional student account for multi-user conflict testing |

> *Note: Public registration strictly forbids self-assigning the `ADMIN` role.*

---

## 5. Supported Facility Categories

The system exclusively supports exactly three core university facility types:

1. **Classrooms**: Smart lecture halls, seminar rooms, and case study studios with interactive podiums, smart boards, and recording equipment (30 – 60 seats).
2. **Laboratories**: Computer science laboratories, GPU & AI deep learning labs, and cybersecurity testbeds (36 – 50 workstations).
3. **Auditoriums**: Flagship campus event halls with stage lighting, 4K LED video walls, and sound systems (200 – 500 seats).

---

## 6. Getting Started & Running Locally

### Prerequisites
- **Java**: OpenJDK 21 (Temurin or Oracle)
- **Maven**: 3.9+
- **Node.js**: v20+ or v24+
- **npm**: 10+

### Option A: Local Development (Default Out-of-the-Box)

The application defaults to an embedded H2 instance configured in full MySQL mode with persistent file storage, requiring zero external database configuration.

#### 1. Start the Backend API:
```bash
cd backend
mvn clean package -DskipTests
java -jar target/campus-booking-backend-1.0.0.jar
```
*Backend starts on `http://localhost:8080`. Flyway migrations and initial seed data are applied automatically.*

#### 2. Start the Frontend:
```bash
cd frontend
npm install
npm run dev
```
*Frontend opens at `http://localhost:5173`.*

---

### Option B: Running with Local MySQL 8 Server

1. Create a MySQL database:
   ```sql
   CREATE DATABASE campus_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
2. Start backend with the `mysql` profile:
   ```bash
   cd backend
   java -jar target/campus-booking-backend-1.0.0.jar --spring.profiles.active=mysql --spring.datasource.url="jdbc:mysql://localhost:3306/campus_booking?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC" --spring.datasource.username=root --spring.datasource.password=YOUR_PASSWORD
   ```

---

### Option C: Running Full Stack with Docker Compose

Ensure Docker Desktop is running, then execute:
```bash
docker-compose up --build
```
This launches:
- **MySQL 8.0**: on port `3306` with persistent storage
- **Backend API**: on port `8080` (health-checked after MySQL starts)
- **Frontend SPA**: on port `3000` served through Nginx reverse proxy

---

## 7. Interactive API Documentation

Once the backend is running, open:
- **Swagger UI**: [http://localhost:8080/swagger-ui.html](http://localhost:8080/swagger-ui.html)
- **OpenAPI 3 JSON Specification**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)
- **H2 Database Console** (Dev profile): [http://localhost:8080/h2-console](http://localhost:8080/h2-console) (JDBC URL: `jdbc:h2:file:./data/campusdb`)

---

## 8. Automated Testing

### Backend Unit & Integration Tests (JUnit 5 + Mockito)
```bash
cd backend
mvn test
```
Tests verify:
- Authentication & BCrypt hashing
- Prevention of self-assigned `ADMIN` role during public registration
- Concurrency conflict detection (`BookingConflictException` mapped to HTTP 409)
- Facility capacity validation
- Operating hours & past date blocking
- Admin approval with conflict revalidation
- Unauthorized cancellation protection

### Frontend Unit & UI Tests (Vitest + Testing Library)
```bash
cd frontend
npm test
```
Tests verify:
- Status badges and facility category pills
- One-click demo credentials and authentication forms
- Role-aware route components

---

## 9. Key REST Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register student/faculty
- `POST /api/v1/auth/login` - Sign in and receive JWT token
- `GET /api/v1/auth/me` - Current user profile
- `PUT /api/v1/auth/profile` - Update own details
- `PUT /api/v1/auth/change-password` - Update password

### Facilities (Resources)
- `GET /api/v1/resources` - Search, filter, paginate facilities
- `GET /api/v1/resources/{id}` - Facility details
- `GET /api/v1/resources/{id}/availability` - Check booked slots for a date
- `POST /api/v1/resources` - Add new facility *(Admin)*
- `PUT /api/v1/resources/{id}` - Update facility *(Admin)*
- `PATCH /api/v1/resources/{id}/status` - Activate / deactivate *(Admin)*

### Bookings
- `POST /api/v1/bookings` - Submit reservation request (concurrency checked)
- `GET /api/v1/bookings/my` - User's reservation history
- `GET /api/v1/bookings/{id}` - Booking details
- `PATCH /api/v1/bookings/{id}/cancel` - Cancel reservation (requester/admin)
- `GET /api/v1/bookings` - Search all campus bookings *(Admin)*
- `PATCH /api/v1/bookings/{id}/approve` - Approve request *(Admin)*
- `PATCH /api/v1/bookings/{id}/reject` - Reject request with reason *(Admin)*

### Notifications & Administration
- `GET /api/v1/notifications` - In-app notifications
- `PATCH /api/v1/notifications/{id}/read` - Mark notification as read
- `PATCH /api/v1/notifications/read-all` - Mark all as read
- `GET /api/v1/admin/dashboard` - Analytics & metrics *(Admin)*
- `GET /api/v1/admin/users` - User directory *(Admin)*
- `PATCH /api/v1/admin/users/{id}/role` - Assign role *(Admin)*
- `GET /api/v1/admin/audit-logs` - Security audit trail *(Admin)*
- `GET /api/v1/admin/booking-policies` - Configurable policies *(Admin)*
- `PUT /api/v1/admin/booking-policies/{id}` - Update policy value *(Admin)*
