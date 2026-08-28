# Gazebo Worlds for QCar

This directory contains custom Gazebo world files for the QCar simulation.

## Available Worlds

### `simple_track.world`

A small enclosed track with walls and obstacles, perfect for testing the QCar's movement and sensors.

**Features:**
- 10m x 10m enclosed area with red boundary walls
- 3 colored obstacles inside:
  - Green box (1x1x1m) at position (2, 2)
  - Blue cylinder (radius 0.5m) at position (-2, -2)
  - Yellow barrier (0.5x2x0.5m) at position (-2, 2)
- Good lighting for camera testing
- Collision-enabled walls for LIDAR testing

**Use this world to:**
- Test robot navigation
- Practice teleoperation
- Observe LIDAR obstacle detection
- Test camera feeds with varied obstacles

## Using Custom Worlds

### Method 1: Docker Compose (Recommended)

Edit `qcar_docker/docker-compose.yml`:

```yaml
environment:
  - GAZEBO_WORLD=/ros2_ws/src/qcar_bringup/worlds/simple_track.world
```

Then restart:
```bash
cd qcar_docker
docker compose down
docker compose up -d
```

### Method 2: Empty for Default

Leave empty to use Gazebo's default empty world:

```yaml
environment:
  - GAZEBO_WORLD=
```

## Creating New Worlds

1. Create a new `.world` file in this directory
2. Use SDF format (version 1.6)
3. Include basic elements:
   - `<physics>` settings
   - `<include>` for sun and ground plane
   - Custom models with `<model>` tags
4. Update `docker-compose.yml` to use your world
5. Rebuild Docker: `docker compose build`
6. Restart: `docker compose up -d`

## Example World Structure

```xml
<?xml version="1.0"?>
<sdf version="1.6">
  <world name="my_world">
    <physics type="ode">
      <max_step_size>0.001</max_step_size>
      <real_time_factor>1</real_time_factor>
    </physics>

    <include>
      <uri>model://sun</uri>
    </include>

    <include>
      <uri>model://ground_plane</uri>
    </include>

    <!-- Your custom models here -->
  </world>
</sdf>
```

## Tips

- Keep worlds simple for better performance
- Use static models for obstacles (better performance)
- Test LIDAR with walls and obstacles
- Add varied lighting for camera testing
- Gazebo Classic (11.x) is used - compatible with ROS 2 Humble

## Resources

- [Gazebo Classic Documentation](http://classic.gazebosim.org/)
- [SDF Format Reference](http://sdformat.org/)
- [Building Custom Worlds](http://classic.gazebosim.org/tutorials?tut=build_world)
