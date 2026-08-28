FROM osrf/ros:humble-desktop

ENV DEBIAN_FRONTEND=noninteractive
SHELL ["/bin/bash", "-lc"]

# ===== System & ROS packages =====
RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y \
        tini \
        x11-apps \
        ros-humble-gazebo-ros-pkgs \
        ros-humble-rviz2 \
        ros-humble-demo-nodes-cpp \
        ros-humble-demo-nodes-py \
        ros-humble-urdf-tutorial \
        ros-humble-rosbridge-server \
        ros-humble-web-video-server \
        ros-humble-rosapi \
        ros-humble-robot-state-publisher \
        ros-humble-joint-state-publisher \
        ros-humble-xacro \
        ros-humble-turtlesim \
        ros-humble-image-transport \
        ros-humble-image-transport-plugins \
        ros-humble-compressed-image-transport \
        xvfb \
        python3-colcon-common-extensions \
        python3-pip \
        git curl net-tools nano dos2unix \
    && rm -rf /var/lib/apt/lists/*

RUN pip3 install --no-cache-dir pyquaternion Pillow numpy

# ===== Workspace =====
WORKDIR /ros2_ws
RUN mkdir -p src

# 1) Clonar tf2_web_republisher_py al workspace
WORKDIR /ros2_ws/src
RUN git clone https://github.com/Wisc-HCI/tf2_web_republisher_py.git

# 1.5) Clonar ROS-TCP-Endpoint para Unity (ROS 2 branch) - v0.6.0
RUN git clone -b main-ros2 https://github.com/Unity-Technologies/ROS-TCP-Endpoint.git ros_tcp_endpoint && \
    cd ros_tcp_endpoint && \
    git checkout ROS2v0.6.0

# 1.6) Copiar Unity Robotics Demo packages para pruebas de conexión
COPY Unity-Robotics-Hub-main/tutorials/ros_unity_integration/ros2_packages/unity_robotics_demo_msgs /ros2_ws/src/unity_robotics_demo_msgs
COPY Unity-Robotics-Hub-main/tutorials/ros_unity_integration/ros2_packages/unity_robotics_demo /ros2_ws/src/unity_robotics_demo

# 2) Copiar tus paquetes (qcar_bringup, qcar_description) al mismo /ros2_ws/src
#    OJO: copia el CONTENIDO de qcar/rosws/src/ dentro de /ros2_ws/src/
COPY qcar/rosws/src/ /ros2_ws/src/

# 3) Build único de TODO el workspace
WORKDIR /ros2_ws
RUN bash -lc "source /opt/ros/humble/setup.bash && colcon build --symlink-install"

# Fuente ROS en shells
RUN echo 'source /opt/ros/humble/setup.bash' >> /etc/bash.bashrc && \
    echo 'source /ros2_ws/install/setup.bash' >> /etc/bash.bashrc

# ===== Tu workspace (debe incluir qcar_description y qcar_bringup) =====
WORKDIR /ros2_ws
RUN mkdir -p src
COPY qcar/ src/qcar_sim/
RUN bash -lc "source /opt/ros/humble/setup.bash && colcon build"

# ===== Archivos runtime =====
# http estático con CORS (lo llama el launch)
COPY http_cors.py /http_cors.py

# entrypoint que genera URDF y lanza todo (Opción 1 con flags)
COPY entrypoint.sh /entrypoint.sh
RUN dos2unix /entrypoint.sh && chmod +x /entrypoint.sh

EXPOSE 9090 8080 7000 10000

# Usa tini como init para señales/zombies y ejecuta el entrypoint
ENTRYPOINT ["/usr/bin/tini","--","/entrypoint.sh"]
