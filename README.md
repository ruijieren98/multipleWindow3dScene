# ACG-final-assignment
Final Assignment for ACG course at Waseda U. [slides](https://esslab.jp/~ess/teaching/2023/acg/project/)

- [x] [Project Proposal](Initial_project.md) [goold drive](https://docs.google.com/document/d/16W4Wd0lcPZ71vZL2U5yrz4i_9uyCbTT8GA3Mi7HI9w4/edit?usp=sharing)
 Due: **2023/12/18**

- [ ] [Presentation Slides](https://docs.google.com/presentation/d/1Gn-UmRjcYgKGUDHAmqA6SSXkL8c9epHFAm9GU6qHqW0/edit?usp=sharing)
 Due: **2024/1/20**


## Getting Started

### Prerequisites
Before you begin, ensure you have the latest version of Node.js installed on your system. You can download it from [Node.js official website](https://nodejs.org/).

### Installation

1. **Clone the Repository**

   Gain a local copy of the project by cloning the repository using the following command:

   ```bash
   git clone https://github.com/ruijieren98/ACG-final-assignment.git
   cd ACG-final-assignment
   ```

2. **Install Dependencies**

    Install Three.js and other necessary dependencies as follows:

    For Three.js, refer to the official [installation guide](https://threejs.org/docs/index.html#manual/en/introduction/Installation) or simply run:
    ```
    npm install --save three
    ```
    
    For Vite, a frontend build tool, install it using:
    ```
    npm install --save-dev vite
    ```

### Running the Project

1. **Start the Server:**

   In the project directory, start the server by running:

   ```bash
   cd ACG-final-assignment/multipleWindow3dScene
   npx vite
   ```

2. **Open the Application:**

   Open a web browser and navigate to http://localhost:5173/ or use the URL provided in the terminal output. For optimal experience and to prevent cache-related issues, it is recommended to use the browser in incognito mode.


## Team Structure and Task Assignment

### Team Member 1: 3D Graphics and Rendering Specialist
- **Tasks:**
  1. Design and create the 3D model of the glossy ball.
  2. Implement the shading and reflection effects for a realistic glossy material.
  3. Optimize rendering performance for web environments.

### Team Member 2: Physics and Interaction Developer
- **Tasks:**
  1. Develop the physics simulation for the bouncing ball.
  2. Implement collision detection for interactions between balls.
  3. Synchronize physics simulation across instances.

### Team Member 3: Web Development and User Interface Expert
- **Tasks:**
  1. Set up the web environment using HTML5 and JavaScript.
  2. Implement window resizing and dragging features.
  3. Create a user-friendly interface for application manipulation.

### Team Member 4: Networking and Real-Time Communication Engineer
- **Tasks:**
  1. Establish real-time communication between application instances.
  2. Ensure accurate data exchange of ball positions and movements.
  3. Handle networking issues like latency and synchronization.

## To-Do List

1. **Initial Setup**
   - Collaboration between Team Members 1 & 2 on 3D model and basic physics.
   - Team Members 3 & 4 set up web environment and preliminary communication.

2. **Development Phase 1**
   - Team Member 1 finalizes rendering and reflective effects.
   - Team Member 2 implements advanced physics and collision dynamics.
   - Team Member 3 develops user interface and window interaction features.
   - Team Member 4 establishes robust real-time communication.

3. **Integration and Testing**
   - Collaborative integration of components by all team members.
   - Conduct thorough testing for bugs and optimization.


4. **Presentation (2024/1/22)**
   - Slides ready **(2024/1/21)**
   - Present the finished project to stakeholders or peers.
   - Gather feedback for future improvements.

5. **Finalization and Documentation (2024/1/29)**
   - Refine user experience based on testing feedback.
   - Documentation of the project by all team members. 2 to 4 A4 pages (with the ACM TOG template which is fairly dense)
   - Prepare application demonstration.


## Reference
[1] MultiWindow Interaction: https://github.com/bgstaal/multipleWindow3dScene/tree/main 

[2] Demo with [1]: https://twitter.com/_nonfigurativ_/status/1727322594570027343

[3] Environment Mapping: https://www.kaiyuusya.jp/webLog/article/threejs-RGBELoader


## Resource
Git Tutorials video: [Youtube](https://www.youtube.com/watch?v=HVsySz-h9r4&list=PL-osiE80TeTuRUfjRe54Eea17-YfnOOAx)

How to Git as a Team: [Blog](https://www.robinwieruch.de/git-team-workflow/)

CG course: [GAMES 101](https://sites.cs.ucsb.edu/~lingqi/teaching/games101.html)


## Presentation

- Environment mapping: 
1. how to load a 2D image so that it looks like a background. 
2. how does CubeCamera work, dynamic update of the scene

- BRDF
1. how the metallness change from glass to glossy balls? If it Desney BRDF?

- Multi-window interaction
1. mention the localstorage and generate a graph

- Ball movement
1. physics?